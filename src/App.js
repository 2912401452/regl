import React from 'react'

// import Index from "./components/Index"
// import Camera from "./components/Camera"
// import Cube from "./components/Cube"
// import Element from "./components/Element"
// import Instances from "./components/Instances"
// import Line from "./components/Line"
// import Scope from "./components/Scope"
// import Stats from "./components/Stats"
// import Text from "./components/Text"
// import Texture from "./components/Texture"
// import Theta360 from "./components/Theta360"
// import Rect from "./components/Rect"
// import Blur from "./components/Blur"
// import Shadow from "./components/Shadow"
// import ShadowVolumn from "./components/ShadowVolumn"
// import ShadowPoint from "./components/ShadowPoint"
// import Raycast from "./components/Raycast"
// import MipMap from "./components/MipMap"
// import Envmap from "./components/Envmap"
// import Reflection from "./components/Reflection"
// import Cubefbo from "./components/Cubefbo"
// import Stenciltransition from "./components/Stenciltransition"
// import Sprite from "./components/Sprite"
// import TexAttr from './components/TexAttr'
import Geomorph from './components/Geomorph'

import Scene from './render/Scene'
import Plane from './components/Plane'
 export default class App extends React.Component {

  componentDidMount() {
    // let scene = new Scene({
    //   el: 'wrap',
    //   animate: true
    // })
    // this.scene = scene
  }

  render() {
    return (
      <div id="wrap" style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }}>
        {/* <Plane global={this} /> */}
        {/* <Index/> */}
        {/* <Camera/> */}
        {/* <Cube/> */}
        {/* <Element/> */}
        {/* <Instances/> */}
        {/* <Line/> */}
        {/* <Scope/> */}
        {/* <Stats/> */}
        {/* <Text/> */}
        {/* <Texture/> */}
        {/* <Theta360/> */}
        {/* <Rect/> */}
        {/* <Blur/> */}
        {/* <Shadow/> */}
        {/* <ShadowVolumn/> */}
        {/* <ShadowPoint/> */}
        {/* <Raycast/> */}
        {/* <MipMap/> */}
        {/* <Envmap/> */}
        {/* <Reflection/> */}
        {/* <Cubefbo/> */}
        {/* <Stenciltransition/> */}
        {/* <Sprite/> */}
        {/* <TexAttr/> */}
        <Geomorph/>
      </div>
    );
  }
}
