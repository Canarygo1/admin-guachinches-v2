// ** Icon imports
import HomeOutline from 'mdi-material-ui/HomeOutline'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import ShieldOutline from 'mdi-material-ui/ShieldOutline'

// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types'
import {Graph, ImageFrame, Post, VideoSwitch,Trophy} from "mdi-material-ui";

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
    },
    {
      title: 'Banners',
      icon: ImageFrame,
      path: '/banners'
    },
    {
      title: 'Encuesta',
      icon: Graph,
      path: '/encuesta'
    },
    {
      title: 'Resultados Encuesta',
      icon: Trophy,
      path: '/encuesta/results'
    }
  ]
}

export default navigation
