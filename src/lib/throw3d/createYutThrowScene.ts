import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  Euler,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion as ThreeQuaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { Body, Box, Plane, Quaternion, Vec3, World } from 'cannon-es'
import { createResourceTracker } from './resourceTracker'
import { buildTargetPoses } from '@/lib/yut/throwPose'
import type { ThrowResult } from '@/lib/yut/types'

export type YutThrowScenePhase = 'idle' | 'launching' | 'settling' | 'revealing' | 'disposed'

export interface YutThrowSceneController {
  startThrow(result: ThrowResult): Promise<void>
  resize(): void
  dispose(): void
}

interface CorrectionState {
  fromPositions: Vector3[]
  fromQuaternions: ThreeQuaternion[]
  toPositions: Vector3[]
  toQuaternions: ThreeQuaternion[]
  startedAt: number
}

interface ActiveThrow {
  correction: CorrectionState | null
  hasEnteredSettling: boolean
  result: ThrowResult
  settledFrames: number
  startedAt: number
  reject: (reason?: unknown) => void
  resolve: () => void
}

interface StickEntry {
  body: Body
  mesh: Mesh
}

const FLOOR_Y = 0
const MAX_INTERNAL_PIXELS = 1280 * 720
const STICK_SIZE = { width: 0.38, height: 0.2, length: 2.15 }
const SLOT_X_POSITIONS = [-1.8, -0.6, 0.6, 1.8] as const
const SPAWN_Y_POSITIONS = [1.8, 2, 2.2, 2.4] as const
const SPAWN_Z_POSITIONS = [0.2, 0.4, 0.6, 0.8] as const
const FINAL_Z_POSITIONS = [0.62, 0.38, 0.54, 0.3] as const
const CORRECTION_DURATION_MS = 180
const SETTLE_TIMEOUT_MS = 2200
const SETTLE_FRAMES_REQUIRED = 6

const LAUNCH_SEEDS = [
  { impulse: new Vec3(-0.8, 5.2, -1.6), torque: new Vec3(-5, 3, 2) },
  { impulse: new Vec3(-0.25, 5.4, -1.3), torque: new Vec3(4, -2, 3) },
  { impulse: new Vec3(0.25, 5.1, -1.4), torque: new Vec3(-3, 4, -2) },
  { impulse: new Vec3(0.8, 5.3, -1.2), torque: new Vec3(5, 2, -3) },
] as const

export function createYutThrowScene(params: {
  canvas: HTMLCanvasElement
  onPhaseChange?: (phase: YutThrowScenePhase) => void
  onReveal?: (result: ThrowResult) => void
}): YutThrowSceneController {
  const { canvas, onPhaseChange, onReveal } = params
  const resourceTracker = createResourceTracker()
  const scene = new Scene()
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  })
  const camera = new PerspectiveCamera(35, 1, 0.1, 40)
  const world = new World({ gravity: new Vec3(0, -9.82, 0), allowSleep: true })
  const groundBody = new Body({ mass: 0, shape: new Plane() })
  const groundQuaternion = new Quaternion().setFromEuler(-Math.PI / 2, 0, 0)
  const floorGeometry = resourceTracker.track(new PlaneGeometry(12, 8))
  const floorMaterial = resourceTracker.track(
    new MeshStandardMaterial({
      color: '#FFFDE7',
      roughness: 0.98,
      metalness: 0,
    }),
  )
  const floorMesh = resourceTracker.track(new Mesh(floorGeometry, floorMaterial))
  const ambientLight = resourceTracker.track(new AmbientLight('#FFF3D8', 1.65))
  const directionalLight = resourceTracker.track(new DirectionalLight('#F3D3A1', 1.15))
  const stickGeometry = resourceTracker.track(
    new BoxGeometry(STICK_SIZE.width, STICK_SIZE.height, STICK_SIZE.length),
  )
  const stickEntries: StickEntry[] = []
  let activeThrow: ActiveThrow | null = null
  let phase: YutThrowScenePhase = 'idle'
  let rafId: number | null = null
  let disposed = false

  camera.position.set(0, 6.5, 8.5)
  camera.lookAt(0, 0.8, 0)

  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.position.y = FLOOR_Y
  scene.add(floorMesh)
  scene.add(ambientLight)
  scene.add(directionalLight)

  directionalLight.position.set(3.5, 7, 4.5)
  groundBody.quaternion.copy(groundQuaternion)
  groundBody.position.set(0, FLOOR_Y, 0)
  world.addBody(groundBody)

  for (let slot = 0; slot < SLOT_X_POSITIONS.length; slot++) {
    const stickMaterials = resourceTracker.track([
      new MeshStandardMaterial({ color: '#C7905C', roughness: 0.9, metalness: 0 }),
      new MeshStandardMaterial({ color: '#C7905C', roughness: 0.9, metalness: 0 }),
      new MeshStandardMaterial({ color: '#E4B67A', roughness: 0.86, metalness: 0 }),
      new MeshStandardMaterial({ color: '#9A6134', roughness: 0.96, metalness: 0 }),
      new MeshStandardMaterial({ color: '#B97C4A', roughness: 0.9, metalness: 0 }),
      new MeshStandardMaterial({ color: '#B97C4A', roughness: 0.9, metalness: 0 }),
    ])
    const mesh = resourceTracker.track(new Mesh(stickGeometry, stickMaterials))
    const body = new Body({
      mass: 0.9,
      shape: new Box(new Vec3(STICK_SIZE.width / 2, STICK_SIZE.height / 2, STICK_SIZE.length / 2)),
      allowSleep: true,
      linearDamping: 0.31,
      angularDamping: 0.4,
      sleepSpeedLimit: 0.15,
      sleepTimeLimit: 0.6,
    })

    scene.add(mesh)
    world.addBody(body)
    resetStickBody(body, slot)
    syncMeshFromBody(mesh, body)
    stickEntries.push({ body, mesh })
  }

  resize()
  renderer.render(scene, camera)

  if (typeof renderer.compileAsync === 'function') {
    void renderer.compileAsync(scene, camera)
  }

  const handleResize = (): void => {
    resize()
  }

  window.addEventListener('resize', handleResize)
  setPhase('idle')
  rafId = window.requestAnimationFrame(loop)

  return {
    startThrow(result: ThrowResult): Promise<void> {
      if (disposed) {
        return Promise.reject(new Error('Cannot start a throw on a disposed scene'))
      }

      if (activeThrow !== null) {
        return Promise.reject(new Error('A throw is already in progress'))
      }

      for (const [slot, entry] of stickEntries.entries()) {
        resetStickBody(entry.body, slot)
        syncMeshFromBody(entry.mesh, entry.body)

        const seed = LAUNCH_SEEDS[slot]
        entry.body.applyImpulse(seed.impulse)
        entry.body.applyTorque(seed.torque)
      }

      setPhase('launching')

      return new Promise<void>((resolve, reject) => {
        activeThrow = {
          correction: null,
          hasEnteredSettling: false,
          result,
          settledFrames: 0,
          startedAt: performance.now(),
          reject,
          resolve,
        }
      })
    },
    resize,
    dispose(): void {
      if (disposed) return
      disposed = true

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }

      window.removeEventListener('resize', handleResize)

      for (const entry of stickEntries) {
        world.removeBody(entry.body)
      }
      world.removeBody(groundBody)

      if (activeThrow !== null) {
        activeThrow.reject(new Error('Scene disposed before throw finished'))
        activeThrow = null
      }

      resourceTracker.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      setPhase('disposed')
    },
  }

  function loop(now: number): void {
    if (disposed) return

    rafId = window.requestAnimationFrame(loop)
    world.fixedStep(1 / 60, 10)

    if (activeThrow?.correction !== null) {
      updateCorrection(now)
    } else {
      for (const entry of stickEntries) {
        syncMeshFromBody(entry.mesh, entry.body)
      }

      if (activeThrow !== null) {
        if (!activeThrow.hasEnteredSettling) {
          activeThrow.hasEnteredSettling = true
          setPhase('settling')
        }

        // Sleep-aware settle detection prevents tiny end-of-bounce jitters from blocking reveal forever.
        if (world.hasActiveBodies === false) {
          activeThrow.settledFrames += 1
        } else {
          activeThrow.settledFrames = 0
        }

        if (
          activeThrow.settledFrames >= SETTLE_FRAMES_REQUIRED ||
          now - activeThrow.startedAt >= SETTLE_TIMEOUT_MS
        ) {
          startCorrection(now)
        }
      }
    }

    renderer.render(scene, camera)
  }

  function resize(): void {
    const dpr = window.devicePixelRatio || 1
    let width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
    let height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
    const pixelCount = width * height

    if (pixelCount > MAX_INTERNAL_PIXELS) {
      const scale = Math.sqrt(MAX_INTERNAL_PIXELS / pixelCount)
      width = Math.max(1, Math.floor(width * scale))
      height = Math.max(1, Math.floor(height * scale))
    }

    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function setPhase(nextPhase: YutThrowScenePhase): void {
    phase = nextPhase
    onPhaseChange?.(phase)
  }

  function startCorrection(now: number): void {
    if (activeThrow === null) return
    const targetPoses = buildTargetPoses(activeThrow.result)

    for (const entry of stickEntries) {
      entry.body.velocity.set(0, 0, 0)
      entry.body.angularVelocity.set(0, 0, 0)
      entry.body.force.set(0, 0, 0)
      entry.body.torque.set(0, 0, 0)
      entry.body.sleep()
    }

    activeThrow.correction = {
      fromPositions: stickEntries.map((entry) => entry.mesh.position.clone()),
      fromQuaternions: stickEntries.map((entry) => entry.mesh.quaternion.clone()),
      toPositions: targetPoses.map((pose) =>
        new Vector3(
          SLOT_X_POSITIONS[pose.slot],
          FLOOR_Y + STICK_SIZE.height / 2,
          FINAL_Z_POSITIONS[pose.slot],
        ),
      ),
      toQuaternions: targetPoses.map((pose) => {
        const rotationX = pose.face === 'flat' ? 0 : Math.PI
        return new ThreeQuaternion().setFromEuler(new Euler(rotationX, pose.yaw, 0))
      }),
      startedAt: now,
    }
  }

  function updateCorrection(now: number): void {
    if (activeThrow?.correction === null || activeThrow === null) return

    const correction = activeThrow.correction
    const progress = Math.min((now - correction.startedAt) / CORRECTION_DURATION_MS, 1)

    // After physics settles, we gently snap to the predetermined result so visuals always match gameplay truth.
    for (const [index, entry] of stickEntries.entries()) {
      const position = correction.fromPositions[index].clone().lerp(correction.toPositions[index], progress)
      const quaternion = correction.fromQuaternions[index].clone().slerp(
        correction.toQuaternions[index],
        progress,
      )

      entry.mesh.position.copy(position)
      entry.mesh.quaternion.copy(quaternion)
      entry.body.position.set(position.x, position.y, position.z)
      entry.body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
    }

    if (progress < 1) return

    const completedThrow = activeThrow
    activeThrow = null
    setPhase('revealing')
    onReveal?.(completedThrow.result)
    completedThrow.resolve()
  }

  function resetStickBody(body: Body, slot: number): void {
    body.position.set(SLOT_X_POSITIONS[slot], SPAWN_Y_POSITIONS[slot], SPAWN_Z_POSITIONS[slot])
    body.velocity.set(0, 0, 0)
    body.angularVelocity.set(0, 0, 0)
    body.force.set(0, 0, 0)
    body.torque.set(0, 0, 0)
    body.quaternion.setFromEuler(0.18 * slot, -0.22 + slot * 0.12, 0.08 * (slot + 1))
    body.wakeUp()
  }

  function syncMeshFromBody(mesh: Mesh, body: Body): void {
    mesh.position.set(body.position.x, body.position.y, body.position.z)
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
  }
}
