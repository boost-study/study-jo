const readline = require("readline");
const r = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const findRepotype = (remoteOption, name, { local, remote }) => {
  if (remoteOption == "remote") return remote;
  if (local.isSelected() || name != undefined) return local;

  local.showRepositories();
};

const File = {
  init(name) {
    this.name = name;
    this.createdAt = Date();
  },

  stringify() {
    return this.name + "\t" + this.createdAt.toLocaleString("ko-KR");
  }
};

const Commit = {
  init(comment, files) {
    this.comment = comment;
    this.files = files; // [File]
    this.createdAt = Date();
  },

  stringify() {
    return 'commit "' + this.comment + '"\n' + this.fileStringify();
  },

  fileStringify() {
    return this.files.map(file => file.stringify()).join("\n");
  }
};

const Repository = {
  init(name) {
    this.name = name;
    this.workFiles = []; //[File]
    this.stageFiles = []; //[File]
    this.commits = []; //[Commit]
    this.lastFileMap = {}; //{ File.name : File }
    this.createdAt = Date();
  },

  addWorking(filename) {
    const file = Object.create(File);
    file.init(filename);
    this.workFiles.push(file);
  },

  moveStaging(filename) {
    const file = this.workFiles.find(function(file) {
      return file.name == filename;
    });
    if (file == undefined) {
      return;
    }
    this.stageFiles.push(file);
    const index = this.workFiles.indexOf(file);
    this.workFiles.splice(index, 1);
  },

  commit(comment) {
    const newCommit = Object.create(Commit);
    newCommit.init(comment, this.stageFiles);
    this.commits.push(newCommit);
    this.stageFiles.forEach(file => {
      this.lastFileMap[file.name] = file;
    });
    this.stageFiles = [];
    return newCommit;
  },

  touch(filename) {
    const lastFiles = Object.values(this.lastFileMap);
    const file = lastFiles.find(function(file) {
      return file.name == filename;
    });
    if (file == undefined) {
      return;
    }
    const touchFile = Object.create(File);
    touchFile.init(file.name);
    this.workFiles.push(touchFile);
  },

  log() {
    console.log("--- push commit log");
    this.commits.forEach(commit => {
      console.log(commit.stringify());
    });
  }
};

const VCSLocal = {
  init() {
    this.repositories = [];
    this.selectedRepository = -1;
  },

  make(repoName) {
    console.log("created " + repoName + " repository.");
    const repo = Object.create(Repository);
    repo.init(repoName);
    this.repositories.push(repo);
  },

  select(name) {
    const found = this.repositories.find(function(repo) {
      return repo.name == name;
    });
    if (found != undefined) {
      this.selectedRepository = this.repositories.indexOf(found);
      return true;
    }
    this.selectedRepository = -1;
    return false;
  },

  isSelected() {
    return this.selectedRepository != -1;
  },

  currentRepo() {
    return this.repositories[this.selectedRepository];
  },

  showRepositories() {
    this.repositories.forEach(repo => {
      console.log(repo.name + "/");
    });
  },

  showStatus(name) {
    let repo;
    if (name == undefined) {
      repo = this.currentRepo();
      if (repo == undefined) {
        return;
      }
    } else {
      repo = this.repositories.find(function(repo) {
        return repo.name == name;
      });
      if (repo == undefined) {
        return;
      }
    }

    console.log("---Working Directory/");
    if (repo.workFiles.length > 0) {
      repo.workFiles.forEach(file => {
        console.log(file.stringify());
      });
      console.log("");
    }

    console.log("---Staging Area/");
    if (repo.stageFiles.length > 0) {
      repo.stageFiles.forEach(file => {
        console.log(file.stringify());
      });
      console.log("");
    }

    console.log("---Git Repository/");
    const lastFiles = Object.values(repo.lastFileMap);
    if (lastFiles.length > 0) {
      lastFiles.forEach(file => {
        console.log(file.stringify());
      });
    }
  },

  newfile(name) {
    const repo = this.currentRepo();
    if (repo == undefined) {
      return;
    }
    repo.addWorking(name);
  },

  moveStage(name) {
    const repo = this.currentRepo();
    if (repo == undefined) {
      return;
    }
    repo.moveStaging(name);
  },

  commit(comment) {
    const repo = this.currentRepo();
    if (repo == undefined) {
      return;
    }
    const commit = repo.commit(comment);
    console.log("---commit files/");
    console.log(commit.fileStringify());
  },

  touch(filename) {
    const repo = this.currentRepo();
    if (repo == undefined) {
      return;
    }
    repo.touch(filename);
  },

  log() {
    const repo = this.currentRepo();
    if (repo == undefined) {
      return;
    }
    repo.log();
  }
};

const VCSRemote = {
  init() {
    this.repositories = [];
    this.selectedRepository = -1;
  },

  push(localRepo) {
    console.log("push some commits...");
    const commits = localRepo.commits.map(commit => {
      console.log(`commit "${commit.comment}" pushed`);
      const files = commit.files.map(file => {
        const curFile = Object.create(File);
        curFile.init(file.name);
        return Object.assign(curFile, {
          createdAt: file.createdAt
        });
      });
      const newCommit = Object.create(Commit);
      return newCommit.init(commit.comment, files);
    });
    const lastFileMap = new Object();
    const keys = Object.keys(localRepo.lastFileMap);
    keys.forEach(key => {
      const file = localRepo.lastFileMap[key];
      const curFile = Object.create(File);
      curFile.init(file.name);
      lastFileMap[key] = Object.assign(curFile, {
        createdAt: file.createdAt
      });
    });

    const origin = this.repositories.find(function(repo) {
      return repo.name == localRepo.name;
    });
    if (origin == undefined) {
      const remoteRepo = Object.create(Repository);
      remoteRepo.init(localRepo.name);
      remoteRepo.lastFileMap = lastFileMap;
      remoteRepo.commits = commits;
      remoteRepo.createdAt = localRepo.createdAt;
      this.repositories.push(remoteRepo);
    } else {
      origin.commits = commits;
      origin.lastFileMap = lastFileMap;
    }
  },

  showRepositories() {
    this.repositories.forEach(repo => {
      console.log(repo.name + "/");
    });
  },

  showStatus(name) {
    let repo;
    if (name == undefined) {
      this.showRepositories();
      return;
    } else {
      repo = this.repositories.find(function(repo) {
        return repo.name == name;
      });
      if (repo == undefined) {
        return;
      }
    }

    console.log("---Git Repository/");
    const lastFiles = Object.values(repo.lastFileMap);
    if (lastFiles.length > 0) {
      lastFiles.forEach(file => {
        console.log(file.stringify());
      });
    }
  }
};

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
