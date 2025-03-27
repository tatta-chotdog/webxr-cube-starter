import * as THREE from "three";

export class CubeController {
  constructor(scene) {
    this.scene = scene;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
      new THREE.MeshBasicMaterial({ color: 0x0000ff }),
      new THREE.MeshBasicMaterial({ color: 0xffff00 }),
      new THREE.MeshBasicMaterial({ color: 0xff00ff }),
      new THREE.MeshBasicMaterial({ color: 0x00ffff }),
    ];
    this.cube = new THREE.Mesh(geometry, materials);
    this.cube.scale.set(0.1, 0.1, 0.1);
    this.cube.position.set(0, -0.1, -0.3);
    scene.add(this.cube);

    this._initOriginalColors();

    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    this.proximityThreshold = 0.1;

    this.isPinching = false;
    this.initialPinchDistance = 0;
    this.initialCubeScale = this.cube.scale.clone();
  }

  _initOriginalColors() {
    this.cube.userData.originalColors = [];
    if (Array.isArray(this.cube.material)) {
      this.cube.material.forEach((mat) => {
        this.cube.userData.originalColors.push(mat.color.clone());
      });
    } else {
      this.cube.userData.originalColors.push(this.cube.material.color.clone());
    }
  }

  update(controllerManager) {
    const highlight = this._updateHighlightStatus(controllerManager);
    this._handlePinch(controllerManager);
    this._updateCubeColor(highlight);
  }

  _updateHighlightStatus(controllerManager) {
    let highlight = false;
    const cubePos = new THREE.Vector3();
    this.cube.getWorldPosition(cubePos);

    const controllers = [
      controllerManager.leftController,
      controllerManager.rightController,
    ];

    controllers.forEach((controller) => {
      if (controller) {
        const pos = new THREE.Vector3();
        controller.getWorldPosition(pos);
        // 近い場合はハイライト
        if (pos.distanceTo(cubePos) < this.proximityThreshold) {
          highlight = true;
        } else {
          // それ以外はレイキャストによる当たり判定でハイライト
          const matrix = new THREE.Matrix4();
          matrix.extractRotation(controller.matrixWorld);
          const rayDir = new THREE.Vector3(0, 0, -1)
            .applyMatrix4(matrix)
            .normalize();
          const rayOrigin = new THREE.Vector3();
          controller.getWorldPosition(rayOrigin);
          this.raycaster.set(rayOrigin, rayDir);
          const intersects = this.raycaster.intersectObject(this.cube);
          if (intersects.length > 0) {
            highlight = true;
          }
        }
      }
    });
    return highlight;
  }

  _handlePinch(controllerManager) {
    const leftController = controllerManager.leftController;
    const rightController = controllerManager.rightController;
    const bothSelected =
      leftController &&
      rightController &&
      leftController.userData.selected === this.cube &&
      rightController.userData.selected === this.cube;

    if (bothSelected) {
      // Cubeの親をシーンに設定し、ワールド座標系で操作する
      if (this.cube.parent !== this.scene) {
        this.scene.attach(this.cube);
      }

      if (!this.isPinching) {
        // ピンチ開始: 初期状態を記録する
        this.isPinching = true;
        const leftPos = new THREE.Vector3();
        leftController.getWorldPosition(leftPos);
        const rightPos = new THREE.Vector3();
        rightController.getWorldPosition(rightPos);

        this.initialPinchDistance = leftPos.distanceTo(rightPos);
        this.initialCubeScale = this.cube.scale.clone();
        // 両手の中点を記録
        this.initialPinchMidpoint = new THREE.Vector3()
          .addVectors(leftPos, rightPos)
          .multiplyScalar(0.5);
        // Cubeの初期ワールド座標を記録
        this.initialCubeWorldPos = new THREE.Vector3();
        this.cube.getWorldPosition(this.initialCubeWorldPos);
      } else {
        // ピンチ中: 両手の現在位置に基づいてスケールと位置を更新
        const leftPos = new THREE.Vector3();
        leftController.getWorldPosition(leftPos);
        const rightPos = new THREE.Vector3();
        rightController.getWorldPosition(rightPos);
        const currentDistance = leftPos.distanceTo(rightPos);
        const scaleFactor = currentDistance / this.initialPinchDistance;
        const newScale = this.initialCubeScale
          .clone()
          .multiplyScalar(scaleFactor);

        // 現在の両手中点の計算
        const currentMidpoint = new THREE.Vector3()
          .addVectors(leftPos, rightPos)
          .multiplyScalar(0.5);

        // 初期中点を基準に、Cubeの新しいワールド座標を計算する
        const offset = new THREE.Vector3().subVectors(
          this.initialCubeWorldPos,
          this.initialPinchMidpoint
        );
        const scaledOffset = offset.multiplyScalar(scaleFactor);
        const newCubeWorldPos = new THREE.Vector3().addVectors(
          currentMidpoint,
          scaledOffset
        );

        // Cubeのスケールと位置を更新
        this.cube.scale.copy(newScale);
        this.cube.position.copy(newCubeWorldPos);
      }
    } else {
      this.isPinching = false;
    }
  }

  _updateCubeColor(highlight) {
    if (Array.isArray(this.cube.material)) {
      this.cube.material.forEach((mat, i) => {
        let intensity = highlight ? 0.4 : 0.0;
        if (this.isPinching) intensity = 0.7;
        if (intensity > 0) {
          mat.color
            .copy(this.cube.userData.originalColors[i])
            .lerp(new THREE.Color(0xffffff), intensity);
        } else {
          mat.color.copy(this.cube.userData.originalColors[i]);
        }
      });
    } else {
      let intensity = highlight ? 0.2 : 0.0;
      if (this.isPinching) intensity = 0.4;
      if (intensity > 0) {
        this.cube.material.color
          .copy(this.cube.userData.originalColors[0])
          .lerp(new THREE.Color(0xffffff), intensity);
      } else {
        this.cube.material.color.copy(this.cube.userData.originalColors[0]);
      }
    }
  }

  onSelectStart(controller) {
    const controllerPos = new THREE.Vector3();
    controller.getWorldPosition(controllerPos);
    const cubePos = new THREE.Vector3();
    this.cube.getWorldPosition(cubePos);

    // Cubeが近い場合は直接掴む
    if (controllerPos.distanceTo(cubePos) < this.proximityThreshold) {
      controller.userData.selected = this.cube;
      controller.attach(this.cube);
      return;
    }

    // Cubeが遠い場合はレイキャストで判定し掴む
    this.tempMatrix.identity().extractRotation(controller.matrixWorld);
    const rayOrigin = new THREE.Vector3().setFromMatrixPosition(
      controller.matrixWorld
    );
    const rayDirection = new THREE.Vector3(0, 0, -1)
      .applyMatrix4(this.tempMatrix)
      .normalize();
    this.raycaster.set(rayOrigin, rayDirection);
    const intersects = this.raycaster.intersectObject(this.cube);
    if (intersects.length > 0) {
      controller.userData.selected = intersects[0].object;
      controller.attach(controller.userData.selected);
    }
  }

  onSelectEnd(controller) {
    if (controller.userData.selected !== undefined) {
      this.scene.attach(controller.userData.selected);
      controller.userData.selected = undefined;
    }
  }
}
