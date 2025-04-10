import { SceneManager } from "./utils/SceneManager.js";
import { ControllerManager } from "./utils/ControllerManager.js";
import { CubeController } from "./utils/CubeController.js";

let sceneManager, controllerManager, cubeController;

const init = () => {
  sceneManager = new SceneManager();
  sceneManager.initAR();

  cubeController = new CubeController(sceneManager.scene);

  controllerManager = new ControllerManager(
    sceneManager.renderer,
    sceneManager.scene
  );
  controllerManager.setSelectCallbacks(
    cubeController.onSelectStart.bind(cubeController),
    cubeController.onSelectEnd.bind(cubeController)
  );
};

const render = () => {
  controllerManager.update();
  cubeController.update(controllerManager);
  sceneManager.render();
};

const animate = () => {
  sceneManager.renderer.setAnimationLoop(render);
};

init();
animate();
