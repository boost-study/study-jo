const readline = require("readline");
const { findRepotype } = require("./utils");

const r = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const { makeLocal, makeRemote } = require("./realRepos")(r);

const local = makeLocal();
const remote = makeRemote();

r.setPrompt("\n/> ");
r.prompt();
r.on("line", function(command) {
  if (command == "quit") {
    r.close();
  }
  const cli = command.split(" ");
  switch (cli[0]) {
    case "init":
      if (cli.length > 1) local.vminit(cli[1]);
      break;
    case "status":
      const repo = findRepotype(cli[1], cli[2], { local, remote });
      if (repo === undefined) break;

      const name = cli[2];
      repo.showStatus(name);
      break;
    case "checkout":
      local.vmcheckout(cli[1]);
      break;
    case "new":
      if (local.selectedRepository > -1) {
        local.vmnew(cli[1]);
      } else {
        console.log("please, checkout repository");
      }
      break;
    case "add":
      if (local.selectedRepository > -1) {
        local.vmadd(cli[1]);
      } else {
        console.log("please, checkout repository");
      }
      break;
    case "commit":
      if (local.selectedRepository > -1) {
        const temp = [...cli];
        temp.splice(0, 1);
        vmcommit(temp.join(" "));
      } else {
        console.log("please, checkout repository");
      }
      break;
    case "touch":
      if (local.selectedRepository > -1) {
        local.vmtouch(cli[1]);
      } else {
        console.log("please, checkout repository");
      }
      break;
    case "log":
      if (local.selectedRepository > -1) {
        local.vmlog();
      } else {
        console.log("please, checkout repository");
      }
      break;
    case "push":
      if (local.selectedRepository > -1) {
        remote.vmpush(local);
      } else {
        console.log("please, checkout repository");
      }
      break;
    default:
      console.log("unknown command");
  }
  r.prompt();
});

r.on("close", function() {
  process.exit();
});
