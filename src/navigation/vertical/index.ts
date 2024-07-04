// ** Icon imports
import HomeOutline from 'mdi-material-ui/HomeOutline'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import ShieldOutline from 'mdi-material-ui/ShieldOutline'

// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types'
import {Post, VideoSwitch} from "mdi-material-ui";

const navigation = (): VerticalNavItemsType => {
  return [
    {
      title: 'Restaurantes',
      icon: HomeOutline,
      path: '/restaurantes'
    },
    {
      title: 'Lista',
      icon: Post,
      path: '/blogPost'
    }   ,
    {
      title: 'Videos',
      icon: VideoSwitch,
      path: '/videos'
    }
  ]
}

export default navigation
