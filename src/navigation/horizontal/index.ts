// ** Icon imports
import HomeOutline from 'mdi-material-ui/HomeOutline'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import ShieldOutline from 'mdi-material-ui/ShieldOutline'

// ** Type import
import { HorizontalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): HorizontalNavItemsType => [
  {
    title: 'Restaurantes',
    icon: HomeOutline,
    path: '/home'
  },
  {
    title: 'Second Page',
    icon: EmailOutline,
    path: '/second-page'
  },
  {
    title: 'Access Control',
    icon: ShieldOutline,
    path: '/acl',
    action: 'read',
    subject: 'acl-page'
  }
]

export default navigation
