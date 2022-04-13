// Need to switch from client html loading to justb eing servered together?

function update() {
  if (player) {
    if (arbTime % 100 == 0) {
      player.info.experience++;
      document.getElementById("exp").innerHTML = player.info.experience;
      if (player.info.experience == 100) {
        player.info.level++;
        document.getElementById("level").innerHTML = player.info.level;
        player.info.experience = 0;
        document.getElementById("exp").innerHTML = player.info.experience;
      }
    }
    arbTime++;
    // This physics only in multi-race.
    if (
      player.info.room == "multi-race" &&
      player.parts.container.y >= mapHeight - player.parts.container.height
    ) {
      player.info.x = 0;
      player.info.y = 0;
      player.parts.container.setPosition(0, 0);
    }
    if (cursors.left.isDown) {
      touchInput = false;
      player.parts.body.flipX = true;
      player.parts.container.body.setVelocityX(-160);
      player.info.facing = "left";
      player.parts.body.anims.play(`${player.info.playerType}-left`, true);
    } else if (cursors.right.isDown) {
      touchInput = false;
      player.parts.body.flipX = false;
      player.parts.container.body.setVelocityX(160);
      player.info.facing = "right";
      player.parts.body.anims.play(`${player.info.playerType}-right`, true);
    } else {
      if (!touchInput) {
        player.parts.container.body.setVelocityX(0);
        player.info.facing = "turn";
        player.parts.body.anims.play(`${player.info.playerType}-turn`);
        touchInput = false;
      }
    }
    if (cursors.space.isDown && player.parts.container.body.touching.down) {
      player.parts.container.body.setVelocityY(-330);
    }
    this.physics.add.collider(groupOfOtherPlayers, platforms);

    // Updating player.info to container.x
    player.info.x = player.parts.container.x;
    player.info.y = player.parts.container.y;

    if (oldPlayerPosition == null) {
      oldPlayerPosition = {
        x: player.info.x,
        y: player.info.y,
        facing: player.info.facing,
      };
    }

    if (
      player.info.x !== oldPlayerPosition.x ||
      player.info.y !== oldPlayerPosition.y
    ) {
      socket.emit("playerMovement", player);
      oldPlayerPosition.x = player.info.x;
      oldPlayerPosition.y = player.info.y;
      oldPlayerPosition.facing = player.info.facing;
    }
    //  Position the center of the camera on the player
    //  We -400 because the camera width is 800px and
    //  we want the center of the camera on the player, not the left-hand side of it

    this.cameras.main.scrollX = player.parts.container.x - 400;
  }
}
