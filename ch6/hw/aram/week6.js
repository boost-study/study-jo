const File = {
  create: function(name) {
    this.name = name;
    this.createdAt = Date();
  },
  stringify: function() {
    return this.name + '\t' + this.createdAt.toLocaleString('ko-KR');
  },
};

const Commit = {
  enroll: function(comment, files) {
    this.comment = comment;
    this.files = files;
    this.createdAt = Date();
  },
  stringify: function() {
    return 'commit "' + this.comment + '"\n' + this.fileStringify();
  },
  fileStringify: function() {
    return this.files.map(file => file.stringify()).join('\n');
  },
};

const Repository = {
  init: function(name) {
    this.name = name;
    this.workFiles = []; //[File]
    this.stageFiles = []; //[File]
    this.commits = [];
    this.lastFileMap = new Object(); //{ File.name : File }
    this.createdAt = Date();
  },
  addWorking: function(filename) {
    var file = Object.create(File);
    file.create(filename);
    this.workFiles.push(file);
  },
  moveStaging: function(filename) {
    var file = this.workFiles.find(function(file) {
      return file.name == filename;
    });

    if (file == undefined) {
      return;
    }
    this.stageFiles.push(file);
    var index = this.workFiles.indexOf(file);
    this.workFiles.splice(index, 1);
  },
  commit: function(comment) {
    var newCommit = Object.create(Commit);
    newCommit.enroll(comment, this.stageFiles);
    this.commits.push(newCommit);
    this.stageFiles.forEach(file => {
      this.lastFileMap[file.name] = file;
    });
    this.stageFiles = [];
    return newCommit;
  },
  touch: function(filename) {
    const lastFiles = Object.values(this.lastFileMap);
    var file = lastFiles.find(function(file) {
      return file.name == filename;
    });
    if (file == undefined) {
      return;
    }
    var touchFile = Object.create(File);
    touchFile.create(filename);
    this.workFiles.push(touchFile);
  },

  log: function() {
    console.log('--- push commit log');
    this.commits.forEach(commit => {
      console.log(commit.stringify());
    });
  },
};

const VCSLocal = {
  init: function() {
    this.repositories = [];
    this.selectedRepository = -1;
  },
  make: function(repoName) {
    console.log('created ' + repoName + ' repository.');
    const repo = Object.create(Repository);
    repo.init(repoName);
    this.repositories.push(repo);
  },
  select: function(name) {
    var found = this.repositories.find(function(repo) {
      return repo.name == name;
    });
    if (found != undefined) {
      this.selectedRepository = this.repositories.indexOf(found);
      return true;
    }
    this.selectedRepository = -1;
    return false;
  },
  isSelected: function() {
    return this.selectedRepository != -1;
  },

  currentRepo: function() {
    return this.repositories[this.selectedRepository];
  },

  showRepositories: function() {
    this.repositories.forEach(repo => {
      console.log(repo.name + '/');
    });
  },
};
