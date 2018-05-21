/// This function gets run on load for the window, see generate_command.html
function generate_command_on_window_load(ros_distro)
{
  // initialize rdepends_level
  $('#rdepends_level').spinedit({
    minimum: 0,
    step: 1
  });
  // register on change for rdepends_level
  $('#rdepends_level').on('change', function() {
    if ($('#rdepends_level').spinedit('value'))
    {
      update_rdepends();
    }
  });
  // register on keydown for rdepends_level
  $('#rdepends_level').on('keydown', function(e) {
    if (e.keyCode == 13 && $('#rdepends_level').spinedit('value'))
    {
      update_rdepends();
    }
  });
  // load and initialize the list of repositories the user will choose from
  load_repositories(ros_distro);
  // global storage for the package_names of custom repositories by repo entry number
  custom_repo_package_names_by_repo_num = {};
}

/// Load the repositories list based on the ros distro with an ajax request
function load_repositories(ros_distro)
{
  $.ajax({
    url: '/get_repo_list/' + ros_distro,
    success: function(response) {
      var repo_list = JSON.parse(response);
      console.log("Received repository list");
      repositories = repo_list['repo_list'];
      build_farm_config_url = repo_list['build_farm_config_url'];
      var ubuntu_platforms = repo_list.release_platforms.ubuntu;
      if (ubuntu_platforms)
      {
        var preferred_list = ['trusty', 'xenial', 'bionic'];
        $.each(ubuntu_platforms, function (index, item) {
          if ($.inArray(item, preferred_list) != -1)
          {
            $('#os_version').append('<option>ubuntu ' + item + '</option>');
          }
        });
        $.each(ubuntu_platforms, function (index, item) {
          if ($.inArray(item, preferred_list) == -1)
          {
            $('#os_version').append('<option>ubuntu ' + item + '</option>');
          }
        });
      }
      var debian_platforms = repo_list.release_platforms.debian;
      if (debian_platforms)
      {
        $.each(debian_platforms, function (index, item) {
          $('#os_version').append('<option>debian ' + item + '</option>');
        });
      }
      $('#ros_buildfarm_url').placard('setValue', repo_list['build_farm_config_url']);
      $('.loading-repositories').hide();
      $('.selecting-repositories').show();
      $('.add-repository').trigger("click");
    },
    error: function(error) {
      console.log(error);
    }
  });
}

/// Remove a repository entry by number (used in on click event for the '-' button)
function remove_repository_entry(num)
{
  clear_repo_info(num);
  $('#repo_entry_' + num).remove();
  update_repo_selects();
  update_next_button_repositories();
}

/// React to the user selecting a new repository (on change for repository list)
function on_repo_select_change(num)
{
  var repo_select = $('#repo_name_' + num);
  var version_select = $('#repo_version_' + num);
  var repository_name = repo_select.val();
  var new_select_value = 0;
  if (repo_select.val() == repo_select.previous_value) {
    new_select_index = version_select[0].selectedIndex;
  }
  if (repo_select[0].selectedIndex == 0) {
    version_select[0].innerHTML = "<option>repository version</option>";
    version_select.attr('disabled', true);
    version_select.trigger('change');
    return;
  }
  var repository = repositories[repository_name];
  version_select.attr('disabled', false);
  version_select[0].innerHTML = "";
  for (var i = 0; i < repository.version.length; i++) {
    version_select.append("<option>" + repository.version[i] + "</option>");
  }
  version_select.trigger('change');
}

/// Disable the wizard's buttons while something is being changed or requested
function disable_wizard_buttons(prev)
{
  prev = typeof prev !== 'undefined' ? prev : true;
  $('.btn-next').attr('disabled', true);
  if (prev)
  {
    $('.btn-prev').attr('disabled', true);
  }
}

/// Enable the wizard's buttons once it is ok to continue to the next page
function enable_wizard_buttons(prev)
{
  prev = typeof prev !== 'undefined' ? prev : true;
  $('.btn-next').attr('disabled', false);
  if (prev)
  {
    $('.btn-prev').attr('disabled', false);
  }
}

/// Enable or disable the wizard buttons based on the state
function update_next_button_repositories()
{
  if (get_selected_repo_names().length == 0)
  {
    disable_wizard_buttons(false);
  }
  else
  {
    enable_wizard_buttons(false);
  }
}

/// Update the view with new package list data
function update_package_lists_for_entry(num, package_names)
{
  var repo = get_repo_info(num).name;
  if ($('#repo_name_' + num).val() != repo)
  {
    // Request out of date, do not update the field
    return;
  }
  enable_wizard_buttons(false);
  $('#package_list_' + num).html(function() {
    var result = 'Packages: ';
    for (var i = 0; i < package_names.length; i++)
    {
      result += '<span class="label label-primary">'
      result += package_names[i] + '</span> ';
    }
    return result;
  });
}

/// Get the package_names for a repository entry based on the number
function get_package_names(repo_num)
{
  var repo_entry_element = $('#repo_entry_' + repo_num);
  if (repo_entry_element.hasClass('custom-repo-entry'))
  {
    return custom_repo_package_names_by_repo_num[repo_num];
  }
  else
  {
    var repo_name = repo_entry_element.find('.repo-name-select').val();
    var repo_version_index = repo_entry_element.find('.repo-version-select')[0].selectedIndex;
    return repositories[repo_name].package_names[repo_version_index];
  }
}
/// Set the package_names for a repository entry based on the number
function set_package_names(repo_num, package_names)
{
  var repo_entry_element = $('#repo_entry_' + repo_num);
  if (repo_entry_element.hasClass('custom-repo-entry'))
  {
    custom_repo_package_names_by_repo_num[repo_num] = package_names;
  }
  else
  {
    var repo_name = repo_entry_element.find('.repo-name-select').val();
    var repo_version_index = repo_entry_element.find('.repo-version-select')[0].selectedIndex;
    repositories[repo_name].package_names[repo_version_index] = package_names;
  }
}

/// Get repo info dictionary based on repo number
function get_repo_info(repo_num)
{
  var repo_data = $('#repo_data_' + repo_num);
  var data = {
    'name': repo_data.find('.repo-name-li').text(),
    'vcs': repo_data.find('.repo-vcs-li').text(),
    'url': repo_data.find('.repo-url-li').text(),
    'branch': repo_data.find('.repo-branch-li').text(),
    'version': repo_data.find('.repo-version-li').text(),
    'is_custom': (repo_data.find('.repo-is-custom-li').text() == 'true'),
  };
  return data;
}

/// Set repo info based on repo number and info data
function set_repo_info(repo_num, repo_name, repo_vcs_type, repo_url, repo_branch, repo_version)
{
  // figure out if it is custom repo or not
  var repo_entry_element = $('#repo_entry_' + repo_num);
  var is_custom_repo = 'false';
  if (repo_entry_element.hasClass('custom-repo-entry')) {
    is_custom_repo = 'true';
  }
  // store repo info in the repo_data div
  var repo_data = $('#repo_data_' + repo_num);
  repo_data[0].innerHTML = "";
  repo_data.append('<span class="repo-name-li" style="display: none;">' + repo_name + '</span>');
  repo_data.append('<span class="label label-success repo-vcs-li">' + repo_vcs_type + '</span>');
  repo_data.append(' ');
  repo_data.append('<span class="repo-url-li">' +
                   '<a href="' + repo_url + '">' + repo_url + '</a>' +
                   '</span>');
  repo_data.append(' ');
  repo_data.append('<span class="label label-default repo-branch-li">' + repo_branch + '</span>');
  repo_data.append('<span class="repo-version-li" style="display: none;">' + repo_version + '</span>');
  repo_data.append('<span class="repo-is-custom-li" style="display: none;">' + is_custom_repo + '</span>');
  repo_data.show();
}

/// Clear the repo info from the repository entry
function clear_repo_info(repo_num)
{
  var repo_data = $('#repo_data_' + repo_num);
  repo_data[0].innerHTML = "";
  repo_data.hide();
}

/// Handle the package list after it has been calculated
function get_package_list_for_remote_repo_cb(data)
{
  var data = JSON.parse(data);
  enable_wizard_buttons(false);
  if (data.status)
  {
    $('#package_list_' + data.repo_entry_number).html(function() {
      var err = '';
      err += '<div class="alert alert-danger" role="alert">'
      err += '  <strong>Error loading remote package list:</strong><br />';
      err += '  ' + data.message;
      err += '</div>';
      return err;
    });
    return;
  }
  set_package_names(data.repo_entry_number, data.package_names);
  update_package_lists_for_entry(data.repo_entry_number, data.package_names);
}

/// Update the list of packages if they need to be
function update_package_lists_and_fetch_if_needed()
{
  $('.repo-entry').each(function(index, item) {
    var repo_num = $(item).attr('entry-num');
    var package_names = get_package_names(repo_num);
    if (!package_names)
    {
      // There is not package data yet, show a loading message and kick off the ajax call.
      update_package_lists(repo_num);
    }
    else
    {
      // The package list is there, update the entry to display it.
      update_package_lists_for_entry(repo_num, package_names);
    }
  });
}

/// Update the list of packages
function update_package_lists(repo_num)
{
  var repo_info = get_repo_info(repo_num);
  disable_wizard_buttons(false);
  $.ajax({
    url: '/get_package_list_for_remote_repo',
    data: {
      'ros_distro': ros_distro,
      'repo': repo_info.name,
      'version': repo_info.version,
      'vcs': repo_info.vcs,
      'url': repo_info.url,
      'branch': repo_info.branch,
      'repo_entry_number': repo_num,
    },
    type: 'POST',
    success: get_package_list_for_remote_repo_cb,
    error: function(error) {
      console.log(error.responseText);
    }
  });
  $('#package_list_' + repo_num).html(
    '<h4>Loading package list...</h4>' +
    '<div class="loader" id="package_list_loader_' + repo_num + '" />'
  ).show();
  $('#package_list_loader_' + repo_num).loader();
}


/// Update the view with the latest list of packages on change for repository or version
function on_repo_version_select_change(num)
{
  var repo_select = $('#repo_name_' + num);
  var version_select = $('#repo_version_' + num);
  if (repo_select[0].selectedIndex == 0)
  {
    // if the user selected the default option in the select input (not actually a repo)
    clear_repo_info(num);
    update_next_button_repositories();
    return;
  }

  var repository_name = repo_select.val();
  var repo = repositories[repository_name];
  var i = version_select[0].selectedIndex;
  set_repo_info(num, repository_name, repo.vcs[i], repo.url[i], repo.branch[i], version_select.val());

  update_next_button_repositories();
  update_package_lists_and_fetch_if_needed();
}

/// Create and return a form for a new repository
function get_repository_entry(num)
{
  var repo_help_msg = "";
  repo_help_msg += "The repository version maps to one of the entries in " +
                   "the ROS distribution.yaml file.";
  repo_help_msg += "The 'devel' entry will usually pull from the projects " +
                   "upstream development repository.";
  repo_help_msg += "Whereas the 'latest' entry will pull the most recently released " +
                   "version from the projects release repository.";
  var e = '';
  e += '<div class="repo-entry" id="repo_entry_' + num + '"';
  e += '     entry-num="' + num + '">';
  e += '  <form class="form-inline">';
  e += '    <div class="form-group">';
  e += '      <button type="button" class="btn btn-danger"';
  e += '              id="rm-repo-' + num + '"';
  e += '              onclick="remove_repository_entry(' + num + ');">';
  e += '        <span class="glyphicon glyphicon-remove-sign"';
  e += '              aria-hidden="true">';
  e += '        </span>';
  e += '      </button>';
  e += '      <select class="form-control repo-name-select"';
  e += '              id="repo_name_' + num + '"';
  e += '              onchange="on_repo_select_change(' + num + ');">';
  e += '        <option>loading repositories...</option>';
  e += '      </select>';
  e += '    </div>';
  e += '    <div class="form-group">';
  e += '      <select class="form-control repo-version-select"';
  e += '              disabled="disabled"';
  e += '              id="repo_version_' + num + '"';
  e += '              onchange="on_repo_version_select_change(' + num + ');">';
  e += '        <option>repository version</option>';
  e += '      </select>';
  e += '    </div>';
  e += '    <button type="button" class="btn btn-info"';
  e += '            data-toggle="tooltip" data-placement="right"';
  e += '            title="' + repo_help_msg + '">';
  e += '      <span class="glyphicon glyphicon-question-sign"';
  e += '            aria-hidden="true">';
  e += '      </span>';
  e += '    </button>';
  e += '    <label class="repo-data" style="display: none;"';
  e += '        id="repo_data_' + num + '">';
  e += '    </label>';
  e += '  </form>';
  e += '  <div class="package-list well well-sm" style="display: none;"';
  e += '       id="package_list_' + num + '" />';
  e += '</div>';
  return e;
}

/// Update the view with the edited custom repo info and the latest list of packages when saved
function save_custom_repository_entry(num)
{
  var repo_text = $('#repo_name_' + num);
  repo_text.prop('disabled', true);
  var type_select = $('#repo_type_' + num);
  type_select.prop('disabled', true);
  type_select.hide();
  var branch_text = $('#repo_branch_' + num);
  branch_text.prop('disabled', true);
  branch_text.hide();
  var url_text = $('#repo_url_' + num);
  url_text.prop('disabled', true);
  url_text.hide();
  $('#save-custom-repo-' + num).hide();
  $('#edit-custom-repo-' + num).show();

  var repo_data = $('#repo_data_' + num);
  var repo_name = repo_text.val();
  var repo_type = type_select.val();
  var repo_url = url_text.val();
  var repo_branch = branch_text.val();
  set_repo_info(num, repo_name, repo_type, repo_url, repo_branch, null);

  update_next_button_repositories();
  update_package_lists(num);
}

function edit_custom_repository_entry(num)
{
  var repo_text = $('#repo_name_' + num);
  repo_text.prop('disabled', false);
  var type_select = $('#repo_type_' + num);
  type_select.prop('disabled', false);
  type_select.show();
  var branch_text = $('#repo_branch_' + num);
  branch_text.prop('disabled', false);
  branch_text.show();
  var url_text = $('#repo_url_' + num);
  url_text.prop('disabled', false);
  url_text.show();
  $('#save-custom-repo-' + num).show();
  $('#edit-custom-repo-' + num).hide();

  clear_repo_info(num);
}

/// Create and return a form for a new custom repository
function get_custom_repository_entry(num)
{
  var repo_help_msg = "";
  repo_help_msg += "The repository name, vcs type, url, and version tuple " +
                   "is used to fetch your custom repository.";
  var e = '';
  e += '<div class="repo-entry custom-repo-entry" id="repo_entry_' + num + '"';
  e += '     entry-num="' + num + '">';
  e += '  <form class="form-inline">';
  e += '    <div class="form-group">';
  e += '      <button type="button" class="btn btn-danger"';
  e += '              id="rm-repo-' + num + '"';
  e += '              onclick="remove_repository_entry(' + num + ');">';
  e += '        <span class="glyphicon glyphicon-remove-sign"';
  e += '              aria-hidden="true">';
  e += '        </span>';
  e += '      </button>';
  e += '      <input type="text"';
  e += '             class="form-control custom-repo-name"';
  e += '             placeholder="custom repository name"';
  e += '             id="repo_name_' + num + '"/>';
  e += '    </div>';
  e += '    <div class="form-group">';
  e += '      <select class="form-control custom-repo-vcs-type"';
  e += '              id="repo_type_' + num + '">';
  e += '        <option>git</option>';
  e += '        <option>hg</option>';
  e += '        <option>svn</option>';
  e += '      </select>';
  e += '      <input type="text"';
  e += '             class="form-control custom-repo-url"';
  e += '             placeholder="custom repository url"';
  e += '             id="repo_url_' + num + '"/>';
  e += '      <input type="text"';
  e += '             class="form-control custom-repo-branch"';
  e += '             placeholder="custom repository branch"';
  e += '             id="repo_branch_' + num + '"/>';
  e += '    </div>';
  e += '    <button type="button" class="btn btn-success"';
  e += '            id="save-custom-repo-' + num + '"';
  e += '            onclick="save_custom_repository_entry(' + num + ');">';
  e += '      <span class="glyphicon glyphicon-ok"';
  e += '            aria-hidden="true">';
  e += '      </span>';
  e += '    </button>';
  e += '    <button type="button" class="btn" style="display: none;"';
  e += '            id="edit-custom-repo-' + num + '"';
  e += '            onclick="edit_custom_repository_entry(' + num + ');">';
  e += '      <span class="glyphicon glyphicon-pencil"';
  e += '            aria-hidden="true">';
  e += '      </span>';
  e += '    </button>';
  e += '    <button type="button" class="btn btn-info"';
  e += '            data-toggle="tooltip" data-placement="right"';
  e += '            title="' + repo_help_msg + '">';
  e += '      <span class="glyphicon glyphicon-question-sign"';
  e += '            aria-hidden="true">';
  e += '      </span>';
  e += '    </button>';
  e += '    <label class="repo-data" style="display: none;"';
  e += '        id="repo_data_' + num + '">';
  e += '    </label>';
  e += '  </form>';
  e += '  <div class="package-list well well-sm" style="display: none;"';
  e += '       id="package_list_' + num + '" />';
  e += '</div>';
  return e;
}

/// Get a dict of selected repositories with the name as the key
function get_selected_repos()
{
  var dict = {};
  $('.repo-entry').each(function(index, element) {
    var item = $(element);
    var repo_num = item.attr('entry-num');
    var repo_info = get_repo_info(repo_num);
    // if custom repo or if standard repo and not the first selection
    if ($(this).hasClass('custom-repo-entry') || $('.repo-name-select', this).selectedIndex != 0) {
      dict[repo_info.name] = {
        entry_num: repo_num,
        repo_info: repo_info,
      }
    }
  });
  return dict;
}

/// Get an array of repo names
function get_selected_repo_names()
{
  var selected_repos = get_selected_repos();
  var selected_repo_names = new Array();
  for (var selected_repo in selected_repos) {
    if (!selected_repos.hasOwnProperty(selected_repo))
    {
      continue;
    }
    selected_repo_names.push(selected_repo);
  }
  return selected_repo_names;
}

function get_dictionary_keys_sorted(dict)
{
  var keys = new Array();
  var i = 0;
  for (var key in dict) {
    if (!dict.hasOwnProperty(key))
    {
      continue;
    }
    keys[i] = key;
    i += 1;
  }
  keys.sort();
  return keys;
}

function update_repo_selects()
{
  var selected_repos = get_selected_repo_names();
  $('.repo-name-select').each(function(index, element) {
    var new_select_index = 0;
    var original_selection = element.value;
    element.innerHTML = "<option>Select a repository...</option>";
    var jelement = $(element);
    var keys = get_dictionary_keys_sorted(repositories);
    var select_index = 0;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (original_selection == key) {
        new_select_index = select_index + 1;
      }
      // Add it to the <select> if the key is current selected or the key is
      // not been selected by another <select>.
      if (original_selection == key || $.inArray(key, selected_repos) == -1) {
        jelement.append("<option>" + key + "</option>");
        select_index += 1;
      }
    }
    element.selectedIndex = new_select_index;
  });
}

function get_rdepends_by_level_and_excludes_cb(data)
{
  rdepends_cache[data.args_hash] = data.rdepends;
  if (data.status)
  {
    $('step_2_error').html(
      "<strong>Error getting dependent packages:</strong><br />" +
      data.message
    );
    return;
  }
  var args = JSON.parse(data.args_hash);
  var excludes = args.excludes;
  var rdepends_without_excludes = data.rdepends;
  if (excludes.length > 0)
  {
    args.excludes = [];
    rdepends_without_excludes = rdepends_cache[JSON.stringify(args)];
  }
  update_rdepends_with_data(data.rdepends, rdepends_without_excludes, excludes);
  $('#dependents_loader').hide();
  $('#rdepends_level').attr('disabled', false);
  $('.pillboxes').pillbox('readonly', false);
  $('.spinedit i').show();
  enable_wizard_buttons();
}

function update_rdepends_with_data(rdepends, without_excludes, excludes)
{
  var pill_items = new Array();
  $.each(rdepends, function (index, item) {
    pill_items[index] = {
      'text': item.name,
      'value': item.name,
      'data': item,
    };
  });
  $('#dependents_to_be_built').pillbox('removeItems');
  $('#dependents_to_be_built').pillbox('addItems', 0, pill_items);
  $('#dependents_to_be_implicitly_excluded').pillbox('removeItems');
  var implicit_pill_items = new Array();
  if (without_excludes && rdepends != without_excludes)
  {
    for (var i = 0; i < without_excludes.length; i++)
    {
      var matched = false;
      var rdepend = without_excludes[i];
      for (var j = 0; j < rdepends.length; j++)
      {
        if (rdepend.name == rdepends[j].name)
        {
          matched = true;
          break;
        }
      }
      if (!matched)
      {
        var in_excludes = false;
        for (var k = 0; k < excludes.length; k++)
        {
          if (rdepend.name == excludes[k])
          {
            in_excludes = true;
          }
        }
        if (!in_excludes)
        {
          implicit_pill_items[implicit_pill_items.length] = {
            'text': rdepend.name,
            'value': rdepend.name,
            'data': rdepend,
          };
        }
      }
    }
  }
  if (implicit_pill_items.length > 0)
  {
    $('#dependents_to_be_implicitly_excluded').pillbox('addItems', 0, implicit_pill_items);
  }
}

function update_rdepends()
{
  var selected_repositories = {};
  $('.repo-entry').each(function(index, item) {
    var item = $(item);
    var repo_num = item.attr('entry-num');
    var repo_info = get_repo_info(repo_num);
    selected_repositories[repo_info.name] = {
      'name': repo_info.name,
      'version': repo_info.version,
      'vcs': repo_info.vcs,
      'url': repo_info.url,
      'branch': repo_info.branch,
      'package_names': get_package_names(repo_num),
    };
  });
  var excludes = new Array();
  $.each($('#dependents_to_be_excluded').pillbox('items'), function (index, item) {
    excludes[index] = item.text;
  });
  var rdepends_args = {
    'ros_distro': ros_distro,
    'repo_list': JSON.stringify(selected_repositories),
    'level': $('#rdepends_level').val(),
    'excludes': JSON.stringify(excludes),
  };
  var args_hash = JSON.stringify(rdepends_args);
  var rdepends = rdepends_cache[args_hash];
  if (!rdepends)
  {
    $('#dependents_loader').show();
    $('#rdepends_level').attr('disabled', true);
    $('.pillboxes').pillbox('readonly', true);
    $('.spinedit i').hide();
    disable_wizard_buttons();
    rdepends_args['args_hash'] = args_hash;
    $.ajax({
      url: '/get_rdepends_by_level_and_excludes',
      data: rdepends_args,
      dataType: 'json',
      method: 'POST',
      success: get_rdepends_by_level_and_excludes_cb,
      error: function(error) {
        console.log(error.responseText);
      }
    });
  }
  else
  {
    var rdepends_without_excludes = rdepends;
    if (excludes.length > 0)
    {
      // deep copy
      var rdepends_args_without_excludes = jQuery.extend(true, {}, rdepends_args);
      rdepends_args_without_excludes.excludes = [];
      var args_hash_without_excludes = JSON.stringify(rdepends_args_without_excludes);
      var rdepends_without_excludes = rdepends_cache[args_hash_without_excludes];
      if (!rdepends_without_excludes)
      {
        var msg = "<strong>Error getting dependent packages:</strong><br />" +
                  "No cached version of the request without any excludes.";
        $('step_2_error').html(msg);
        console.log(msg);
      }
    }
    update_rdepends_with_data(rdepends, rdepends_without_excludes, excludes);
  }
}

function update_command_output()
{
  // The os_version variable comes back from the select looking like:
  // 'ubuntu bionic'.  We can use this directly below
  var os_version = $('#os_version').val();
  var selected_repos = get_selected_repos();
  var package_specific_selected_repos = {};
  var custom_selected_repos = {};
  var non_custom_selected_repo_names = Array();
  for (var key in selected_repos) {
    if (!selected_repos.hasOwnProperty(key)) {
      continue;
    }
    var repo_num = selected_repos[key].entry_num;
    var repo_info = get_repo_info(repo_num);
    if (repo_info.is_custom)
    {
      custom_selected_repos[key] = selected_repos[key];
    }
    else if (repo_info.branch.includes("{package}"))
    {
      package_specific_selected_repos[key] = selected_repos[key];
    } else
    {
      non_custom_selected_repo_names.push(key);
    }
  }
  var excludes = new Array();
  $.each($('#dependents_to_be_excluded').pillbox('items'), function(index, item) {
    excludes[index] = item.text;
  });
  var extra_packages = new Array();
  $.each($('#extra_packages').pillbox('items'), function(index, item) {
    extra_packages[index] = item.text;
  });
  var rdepends_level = $('#rdepends_level').val();
  msg =
    // '<pre>' +
    'mkdir -p /tmp/prerelease_job</br>' +
    'cd /tmp/prerelease_job</br>' +
    'generate_prerelease_script.py \\<br/>' +
    '  ' + build_farm_config_url + ' \\<br/>' +
    '  ' + ros_distro + ' default ' + os_version + ' amd64 \\<br/>';
  if (non_custom_selected_repo_names.length > 0) {
    msg += '  ' + non_custom_selected_repo_names.join(' ') + ' \\<br/>';
  }
  var custom_repo_in_msg = false;
  for (var repo_name in custom_selected_repos) {
    if (!custom_selected_repos.hasOwnProperty(repo_name)) {
      continue;
    }
    if (!custom_repo_in_msg) {
      msg += '  --custom-repo \\<br/>';
      custom_repo_in_msg = true;
    }
    var repo_num = custom_selected_repos[repo_name].entry_num;
    var repo_info = get_repo_info(repo_num);
    msg +=
      '    ' +
      repo_info.name + '__custom-' + repo_num + ':' +
      repo_info.vcs + ':' +
      repo_info.url + ':' +
      repo_info.branch + ' \\<br/>';
  }
  for (var repo_name in package_specific_selected_repos) {
    if (!package_specific_selected_repos.hasOwnProperty(repo_name)) {
      continue;
    }
    if (!custom_repo_in_msg) {
      msg += '  --custom-repo \\<br/>';
      custom_repo_in_msg = true;
    }
    var repo_num = package_specific_selected_repos[repo_name].entry_num;
    var repo_info = get_repo_info(repo_num);
    var packages = get_package_names(repo_num);
    for (var j = 0; j < packages.length; j++) {
      var package_name = packages[j];
      var package_specific_branch = repo_info.branch.replace("{package}", package_name);
      msg +=
        '    ' +
        package_name + ':' + repo_info.vcs + ':' + repo_info.url + ':' + package_specific_branch + ' \\<br/>';
    }
  }
  msg +=
    '  --level ' + rdepends_level + ' \\<br/>' +
    '  --output-dir ./';
  if (excludes.length > 0)
  {
    msg += ' \\<br/>  --exclude-pkg ' + excludes.join(' ');
  }
  if (extra_packages.length > 0)
  {
    msg += ' \\<br/>  --pkg ' + extra_packages.join(' ');
  }
  // msg += '</pre>';
  $('#command_output').html(msg);
}

$(document).ready(function() {
  // Global variables
  rdepends_cache = {};

  var number_of_repositories = 0;
  // Add handler for "add-repository"
  $(".add-repository").click(function(evnt) {
    evnt.preventDefault();
    var new_element = get_repository_entry(number_of_repositories);
    $('.repositories').append(new_element);
    number_of_repositories += 1;
    update_repo_selects();
    update_next_button_repositories();
    // $('[data-toggle="popover"]').popover();
    $('[data-toggle="tooltip"]').tooltip();
    $('.repo-name-select').focus();
  });
  // Add handler for "add-custom-repository"
  $(".add-custom-repository").click(function(evnt) {
    evnt.preventDefault();
    var new_element = get_custom_repository_entry(number_of_repositories);
    $('.repositories').append(new_element);
    number_of_repositories += 1;
    update_repo_selects();
    update_next_button_repositories();
    $('[data-toggle="tooltip"]').tooltip();
    $('.custom-repo-name').focus();
  });
  // Add handler for next action clicked on the wizard
  $('#prerelease_wizard').on('actionclicked.fu.wizard', function(evt, data) {
    if (data.step == 1) // Select repositories
    {

    }
    if (data.step == 2) // Extra configs
    {
      if (data.direction == 'next')
      {
        update_rdepends();
      }
    }
    if (data.step == 3) // Select dependents to test
    {

    }
  });
  $('#prerelease_wizard').on('finished.fu.wizard', function(evt, data) {
    $('#command_modal').modal('show');
  });
  $('#command_modal').on('show.bs.modal', function(evt, data) {
    update_command_output();
  });
  // Add a handlers for removing pillboxes
  $('#dependents_to_be_built').on('removed.fu.pillbox', function(evt, data) {
    if (data.method != "removeAll")
    {
      $('#dependents_to_be_excluded').pillbox('addItems', [data]);
      update_rdepends();
    }
  });
  $('#dependents_to_be_excluded').on('removed.fu.pillbox', function(evt, data) {
    if (data.method != "removeAll")
    {
      $('#dependents_to_be_included').pillbox('addItems', [data]);
      update_rdepends();
    }
  });
});
