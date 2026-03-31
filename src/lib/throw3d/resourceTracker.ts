import { Object3D } from 'three'

type Disposable = { dispose: () => void }
type Trackable = Object3D | Disposable | Disposable[]

export interface ResourceTracker {
  track<T extends Trackable>(resource: T): T
  dispose(): void
}

export function createResourceTracker(): ResourceTracker {
  const resources = new Set<Trackable>()

  return {
    track<T extends Trackable>(resource: T): T {
      resources.add(resource)
      return resource
    },

    dispose(): void {
      for (const resource of resources) {
        if (Array.isArray(resource)) {
          for (const item of resource) {
            item.dispose()
          }
          continue
        }

        if (resource instanceof Object3D && resource.parent) {
          // Detach scene nodes first so repeated overlay mounts do not keep stale graph references alive.
          resource.parent.remove(resource)
        }

        if ('dispose' in resource && typeof resource.dispose === 'function') {
          resource.dispose()
        }
      }

      resources.clear()
    },
  }
}
