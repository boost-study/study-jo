const { File, Commit, Repository } = require("./units");

exports.VCSLocal = {
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

exports.VCSRemote = {
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
