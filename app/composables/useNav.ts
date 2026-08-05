/**
 * Shared navigation targets and the "am I here?" test.
 *
 * NuxtLink's own `active-class` treats `/` as a prefix of every route, so the
 * home link would light up everywhere. Matching explicitly is both correct and
 * easier to follow.
 */
export interface NavItem {
  to: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/library', label: 'Library', icon: 'library' },
  { to: '/drill?scope=review&mode=mixed', label: 'Review', icon: 'review' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
]

export function useNav() {
  const route = useRoute()

  function isActive(to: string): boolean {
    const path = to.split('?')[0]!
    return path === '/' ? route.path === '/' : route.path.startsWith(path)
  }

  return { items: NAV_ITEMS, isActive }
}
