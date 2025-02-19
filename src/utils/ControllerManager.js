import * as THREE from "three";

export class ControllerManager {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;

    // 左右コントローラーの初期化
    this.leftController = renderer.xr.getController(0);
    this.leftController.addEventListener(
      "selectstart",
      this.onSelectStart.bind(this)
    );
    this.leftController.addEventListener(
      "selectend",
      this.onSelectEnd.bind(this)
    );
    scene.add(this.leftController);

    this.rightController = renderer.xr.getController(1);
    this.rightController.addEventListener(
      "selectstart",
      this.onSelectStart.bind(this)
    );
    this.rightController.addEventListener(
      "selectend",
      this.onSelectEnd.bind(this)
    );
    scene.add(this.rightController);

    // レイ表示用ArrowHelperの初期化
    const leftOrigin = new THREE.Vector3();
    this.leftController.getWorldPosition(leftOrigin);
    this.leftArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      leftOrigin,
      0.5,
      0xffff00
    );
    scene.add(this.leftArrowHelper);

    const rightOrigin = new THREE.Vector3();
    this.rightController.getWorldPosition(rightOrigin);
    this.rightArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      rightOrigin,
      0.5,
      0x00ff00
    );
    scene.add(this.rightArrowHelper);
  }

  /**
   * 左右コントローラーのArrowHelper更新処理
   */
  update() {
    if (this.leftController) {
      const matrix = new THREE.Matrix4();
      matrix.extractRotation(this.leftController.matrixWorld);
      const direction = new THREE.Vector3(0, 0, -1)
        .applyMatrix4(matrix)
        .normalize();
      const origin = new THREE.Vector3();
      this.leftController.getWorldPosition(origin);
      this.leftArrowHelper.setDirection(direction);
      this.leftArrowHelper.position.copy(origin);
    }

    if (this.rightController) {
      const matrix = new THREE.Matrix4();
      matrix.extractRotation(this.rightController.matrixWorld);
      const direction = new THREE.Vector3(0, 0, -1)
        .applyMatrix4(matrix)
        .normalize();
      const origin = new THREE.Vector3();
      this.rightController.getWorldPosition(origin);
      this.rightArrowHelper.setDirection(direction);
      this.rightArrowHelper.position.copy(origin);
    }
  }

  setSelectCallbacks(startCallback, endCallback) {
    this.selectStartCallback = startCallback;
    this.selectEndCallback = endCallback;
  }

  onSelectStart(event) {
    const controller = event.target;
    if (this.selectStartCallback) {
      this.selectStartCallback(controller);
    }
  }

  onSelectEnd(event) {
    const controller = event.target;
    if (this.selectEndCallback) {
      this.selectEndCallback(controller);
    }
  }
}
