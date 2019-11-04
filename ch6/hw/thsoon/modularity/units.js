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

module.exports = { File, Commit, Repository };
