const { VCSLocal, VCSRemote } = require("./vmRepos");

module.exports = r => {
  const local = Object.create(VCSLocal);
  local.init();
  const remote = Object.create(VCSRemote);
  remote.init();

  local.vminit = function(repoName) {
    this.make(repoName);
  };

  local.vmcheckout = function(name) {
    if (name == undefined) {
      this.select("");
      r.setPrompt("\n/> ");
      return;
    }
    if (this.select(name)) {
      r.setPrompt("\n/" + name + "/> ");
    }
  };

  local.vmnew = function(name) {
    if (name == undefined) {
      console.log("please, input filename");
    }
    this.newfile(name);
  };

  local.vmadd = function(name) {
    if (name == undefined) {
      console.log("please, input filename");
    }
    this.moveStage(name);
  };

  local.vmcommit = function(comment) {
    if (comment == undefined || comment == "") {
      console.log("please, add comment for commit");
    }
    this.commit(comment);
  };

  local.vmtouch = function(file) {
    if (file == undefined || file == "") {
      console.log("please, input filename");
    }
    this.touch(file);
  };

  local.vmlog = function() {
    this.log();
  };

  local.vmStatus = function(name) {
    this.showStatus(name);
  };
  local.vmRepositories = function() {
    this.printRepositories();
  };
  // 변경
  remote.vmpush = function(localRepo) {
    this.push(localRepo.currentRepo());
  };
  remote.vmStatus = function(name) {
    this.showStatus(name);
  };

  return {
    makeLocal() {
      return local;
    },
    makeRemote() {
      return remote;
    }
  };
};
