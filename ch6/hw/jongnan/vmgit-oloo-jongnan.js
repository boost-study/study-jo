const readline = require('readline');
const r = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const File = {
	init(name) {
		this.name = name;
		this.createdAt = Date();
	},
	stringify() {
		return this.name + '\t' + this.createdAt.toLocaleString('ko-KR');
	},
};

const Commit = {
	init(comment, files) {
		this.comment = comment;
		this.files = files;
		this.createdAt = Date();
	},

	stringify() {
		return 'commit "' + this.comment + '"\n' + this.fileStringify();
	},

	fileStringify() {
		return this.files.map(file => file.stringify()).join('\n');
	},
};

const Repository = {
	init(name) {
		this.name = name;
		this.workFiles = [];
		this.stageFiles = [];
		this.commits = [];
		this.lastFileMap = new Object();
		this.createdAt = Date();
	},

	addWorking(filename) {
		const file = Object.create(File);
		file.init(filename);
		this.workFiles.push(file);
	},

	moveStaging(filename) {
		const file = this.workFiles.find(file => file.name == filename);
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
		const file = lastFiles.find(file => file.name == filename);
		if (file == undefined) {
			return;
		}
		const touchFile = Object.create(File);
		touchFile.init(file.name);
		this.workFiles.push(touchFile);
	},

	log() {
		console.log('--- push commit log');
		this.commits.forEach(commit => {
			console.log(commit.stringify());
		});
	},
};

const VCS = {
	init() {
		this.repositories = [];
		this.selectedRepository = -1;
	},

	showRepositories() {
		this.repositories.forEach(repo => {
			console.log(repo.name + '/');
		});
	},
};

const VCSLocal = Object.create(VCS);
VCSLocal.init();
VCSLocal.make = function(repoName) {
	console.log('created ' + repoName + ' repository.');
	const repo = Object.create(Repository);
	repo.init(repoName);
	this.repositories.push(repo);
};
VCSLocal.select = function(name) {
	const found = this.repositories.find(repo => repo.name == name);
	if (found != undefined) {
		this.selectedRepository = this.repositories.indexOf(found);
		return true;
	}
	this.selectedRepository = -1;
	return false;
};
VCSLocal.isSelected = function() {
	return this.selectedRepository != -1;
};
VCSLocal.currentRepo = function() {
	return this.repositories[this.selectedRepository];
};
VCSLocal.showStatus = function(name) {
	let repo;
	if (name == undefined) {
		repo = this.currentRepo();
		if (repo == undefined) {
			return;
		}
	} else {
		repo = this.repositories.find(repo => repo.name == name);
		if (repo == undefined) {
			return;
		}
	}

	console.log('---Working Directory/');
	if (repo.workFiles.length > 0) {
		repo.workFiles.forEach(file => {
			console.log(file.stringify());
		});
		console.log('');
	}

	console.log('---Staging Area/');
	if (repo.stageFiles.length > 0) {
		repo.stageFiles.forEach(file => {
			console.log(file.stringify());
		});
		console.log('');
	}

	console.log('---Git Repository/');
	const lastFiles = Object.values(repo.lastFileMap);
	if (lastFiles.length > 0) {
		lastFiles.forEach(file => {
			console.log(file.stringify());
		});
	}
};
VCSLocal.newfile = function(name) {
	const repo = this.currentRepo();
	if (repo == undefined) {
		return;
	}
	repo.addWorking(name);
};
VCSLocal.moveStage = function(name) {
	const repo = this.currentRepo();
	if (repo == undefined) {
		return;
	}
	repo.moveStaging(name);
};
VCSLocal.commit = function(comment) {
	const repo = this.currentRepo();
	if (repo == undefined) {
		return;
	}
	const commit = repo.commit(comment);
	console.log('---commit files/');
	console.log(commit.fileStringify());
};
VCSLocal.touch = function(filename) {
	const repo = this.currentRepo();
	if (repo == undefined) {
		return;
	}
	repo.touch(filename);
};
VCSLocal.log = function() {
	const repo = this.currentRepo();
	if (repo == undefined) {
		return;
	}
	repo.log();
};

const VCSRemote = Object.create(VCS);
VCSRemote.init();
VCSRemote.push = function(localRepo) {
	console.log('push some commits...');
	const commits = localRepo.commits.map(commit => {
		console.log(`commit "${commit.comment}" pushed`);
		const files = commit.files.map(file => {
			const newFile = Object.create(File);
			newFile.init(file.name);
			return Object.assign(newFile, {
				createdAt: file.createdAt,
			});
		});
		const newCommit = Object.create(Commit);
		newCommit.init(commit.comment, files);
		return newCommit;
	});
	const lastFileMap = new Object();
	const keys = Object.keys(localRepo.lastFileMap);
	keys.forEach(key => {
		const file = localRepo.lastFileMap[key];
		const newFile = Object.create(File);
		newFile.init(file.name);
		lastFileMap[key] = Object.assign(newFile, {
			createdAt: file.createdAt,
		});
	});

	const origin = this.repositories.find(repo => repo.name == localRepo.name);
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
};
VCSRemote.showStatus = function(name) {
	let repo;
	if (name == undefined) {
		this.showRepositories();
		return;
	} else {
		repo = this.repositories.find(repo => repo.name == name);
		if (repo == undefined) {
			return;
		}
	}

	console.log('---Git Repository/');
	const lastFiles = Object.values(repo.lastFileMap);
	if (lastFiles.length > 0) {
		lastFiles.forEach(file => {
			console.log(file.stringify());
		});
	}
};

// var local = new VCSLocal();
// var remote = new VCSRemote();

const local = Object.create(VCSLocal);
const remote = Object.create(VCSRemote);

r.setPrompt('\n/> ');
r.prompt();
r.on('line', function(command) {
	if (command == 'quit') {
		r.close();
	}
	var cli = command.split(' ');
	switch (cli[0]) {
		case 'init':
			if (cli.length > 1) vminit(cli[1]);
			break;
		case 'status':
			vmstatus(cli[1], cli[2]);
			break;
		case 'checkout':
			vmcheckout(cli[1]);
			break;
		case 'new':
			if (local.selectedRepository > -1) {
				vmnew(cli[1]);
			} else {
				console.log('please, checkout repository');
			}
			break;
		case 'add':
			if (local.selectedRepository > -1) {
				vmadd(cli[1]);
			} else {
				console.log('please, checkout repository');
			}
			break;
		case 'commit':
			if (local.selectedRepository > -1) {
				var temp = [...cli];
				temp.splice(0, 1);
				vmcommit(temp.join(' '));
			} else {
				console.log('please, checkout repository');
			}
			break;
		case 'touch':
			if (local.selectedRepository > -1) {
				vmtouch(cli[1]);
			} else {
				console.log('please, checkout repository');
			}
			break;
		case 'log':
			if (local.selectedRepository > -1) {
				vmlog();
			} else {
				console.log('please, checkout repository');
			}
			break;
		case 'push':
			if (local.selectedRepository > -1) {
				vmpush();
			} else {
				console.log('please, checkout repository');
			}
			break;
		default:
			console.log('unknown command');
	}
	r.prompt();
});

r.on('close', function() {
	process.exit();
});

function vminit(repoName) {
	local.make(repoName);
}

function vmstatus(remoteOption, name) {
	if (remoteOption == 'remote') {
		remote.showStatus(name);
		return;
	}
	if (local.isSelected() || name != undefined) {
		local.showStatus(name);
		return;
	}
	local.showRepositories();
}

function vmcheckout(name) {
	if (name == undefined) {
		local.select('');
		r.setPrompt('\n/> ');
		return;
	}
	if (local.select(name)) {
		r.setPrompt('\n/' + name + '/> ');
	}
}

function vmnew(name) {
	if (name == undefined) {
		console.log('please, input filename');
	}
	local.newfile(name);
}

function vmadd(name) {
	if (name == undefined) {
		console.log('please, input filename');
	}
	local.moveStage(name);
}

function vmcommit(comment) {
	if (comment == undefined || comment == '') {
		console.log('please, add comment for commit');
	}
	local.commit(comment);
}

function vmtouch(file) {
	if (file == undefined || file == '') {
		console.log('please, input filename');
	}
	local.touch(file);
}

function vmlog() {
	local.log();
}

function vmpush() {
	remote.push(local.currentRepo());
}
