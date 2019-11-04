exports.findRepotype = (remoteOption, name, { local, remote }) => {
  if (remoteOption == "remote") return remote;
  if (local.isSelected() || name != undefined) return local;

  local.showRepositories();
};
