function load_repositories(ros_distro)
{
  Dajaxice.prerelease_website.submit_jobs.get_repo_list_ajax(
    load_repositories_cb,
    {'ros_distro': ros_distro}
  );
}

function load_repositories_cb(repo_list)
{
  console.log("Received repository list");
  repositories = repo_list['repo_list'];
  build_farm_config_url = repo_list['build_farm_config_url'];
  var ubuntu_platforms = repo_list.release_platforms.ubuntu;
  if (ubuntu_platforms)
  {
    var prefered_list = ['trusty', 'xenial'];
    $.each(ubuntu_platforms, function (index, item) {
      if ($.inArray(item, prefered_list) != -1)
      {
        $('#os_version').append('<option>' + item + '</option>');
      }
    });
    $.each(ubuntu_platforms, function (index, item) {
      if ($.inArray(item, prefered_list) == -1)
      {
        $('#os_version').append('<option>' + item + '</option>');
      }
    });
  }
  $('#ros_buildfarm_url').placard('setValue', repo_list['build_farm_config_url']);
  $('.loading-repositories').hide();
  $('.selecting-repositories').show();
  $('.add-repository').trigger("click");
}

function remove_repository_entry(num)
{
  $('#repo_entry_' + num).remove();
  update_repo_selects();
  update_next_button_repositories();
}

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

function disable_wizard_buttons(prev)
{
  prev = typeof prev !== 'undefined' ? prev : true;
  $('.btn-next').attr('disabled', true);
  if (prev)
  {
    $('.btn-prev').attr('disabled', true);
  }
}

function enable_wizard_buttons(prev)
{
  prev = typeof prev !== 'undefined' ? prev : true;
  $('.btn-next').attr('disabled', false);
  if (prev)
  {
    $('.btn-prev').attr('disabled', false);
  }
}

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

function update_package_lists_for_entry(num, repo, package_names)
{
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

function get_package_list_for_remote_repo_cb(data)
{
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
  var repo_version_index = $('#repo_version_' + data.repo_entry_number)[0].selectedIndex;
  repositories[data.repo].package_names[repo_version_index] = data.package_names;
  update_package_lists_for_entry(data.repo_entry_number, data.repo, data.package_names);
}

function update_package_lists_and_fetch_if_needed()
{
  $('.repo-entry').each(function(index, item) {
    item = $(item);
    var repo = item.find('.repo-name-select').val();
    var repo_num = item.attr('entry-num');
    var repo_version_index = $('#repo_version_' + repo_num)[0].selectedIndex;
    var package_names = repositories[repo].package_names[repo_version_index];
    if (!package_names)
    {
      // There is not package data yet, show a loading message and kick off the ajax call.
      disable_wizard_buttons(false);
      var repo_version = $('#repo_version_' + repo_num).val();
      var repo_vcs_type = item.find('.repo-vcs-li').text();
      var repo_vcs_url = item.find('.repo-url-li').text();
      var repo_vcs_branch = item.find('.repo-branch-li').text();
      Dajaxice.prerelease_website.submit_jobs.get_package_list_for_remote_repo_ajax(
        get_package_list_for_remote_repo_cb,
        {
          'ros_distro': ros_distro,
          'repo': repo,
          'version': repo_version,
          'vcs': repo_vcs_type,
          'url': repo_vcs_url,
          'branch': repo_vcs_branch,
          'repo_entry_number': repo_num,
        }
      );
      $('#package_list_' + repo_num).html(
        '<h4>Loading package list...</h4>' +
        '<div class="loader" id="package_list_loader_' + repo_num + '" />'
      ).show();
      $('#package_list_loader_' + repo_num).loader();
    }
    else
    {
      // The package list is there, update the entry to display it.
      update_package_lists_for_entry(repo_num, repo, package_names);
    }
  });
}

function on_repo_version_select_change(num)
{
  var repo_select = $('#repo_name_' + num);
  var version_select = $('#repo_version_' + num);
  var repo_data = $('#repo_data_' + num);
  if (repo_select[0].selectedIndex == 0)
  {
    repo_data[0].innerHTML = "";
    repo_data.hide();
    update_next_button_repositories();
    return;
  }
  var repository_name = repo_select.val();
  var repo = repositories[repository_name];
  var i = version_select[0].selectedIndex;
  repo_data[0].innerHTML = "";
  repo_data.append('<span class="label label-success repo-vcs-li">' + repo.vcs[i] + '</span>');
  repo_data.append(' ');
  repo_data.append('<span class="repo-url-li">' +
                   '<a href="' + repo.url[i] + '">' + repo.url[i] + '</a>' +
                   '</span>');
  repo_data.append(' ');
  repo_data.append('<span class="label label-default repo-branch-li">' + repo.branch[i] + '</span>');
  repo_data.show();
  update_next_button_repositories();
  update_package_lists_and_fetch_if_needed();
}

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

function get_selected_repo_names()
{
  var selected_repos = new Array();
  $('.repo-name-select').each(function(index, element) {
    if (element.selectedIndex != 0) {
      selected_repos[index] = element.value;
    }
  });
  return selected_repos;
}

function get_selected_repos()
{
  var dict = {};
  $('.repo-entry').each(function(index, element) {
    var item = $(element);
    var repo = item.find('.repo-name-select').val();
    var repo_num = item.attr('entry-num');
    if ($('.repo-name-select', this).selectedIndex != 0) {
      dict[repo] = {
        entry_num: repo_num
      }
    }
  });
  return dict;
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
    var repo = item.find('.repo-name-select').val();
    var repo_version = item.find('.repo-version-select').val();
    var repo_version_index = item.find('.repo-version-select')[0].selectedIndex;
    var repo_vcs_type = item.find('.repo-vcs-li').text();
    var repo_url_type = item.find('.repo-url-li').text();
    var repo_branch_type = item.find('.repo-branch-li').text();
    selected_repositories[repo] = {
      'name': repo,
      'version': repo_version,
      'vcs': repo_vcs_type,
      'url': repo_url_type,
      'branch': repo_branch_type,
      'package_names': repositories[repo].package_names[repo_version_index],
    };
  });
  var excludes = new Array();
  $.each($('#dependents_to_be_excluded').pillbox('items'), function (index, item) {
    excludes[index] = item.text;
  });
  var rdepends_args = {
    'ros_distro': ros_distro,
    'repo_list': selected_repositories,
    'level': $('#rdepends_level').val(),
    'excludes': excludes,
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
    Dajaxice.prerelease_website.submit_jobs.get_rdepends_by_level_and_excludes_ajax(
      get_rdepends_by_level_and_excludes_cb,
      rdepends_args
    );
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
  var os_version = $('#os_version').val();
  var selected_repos = get_selected_repos();
  var custom_selected_repos = {};
  var non_custom_selected_repo_names = Array();
  for (var key in selected_repos) {
    if (!selected_repos.hasOwnProperty(key)) {
      continue;
    }
    var repo_num = selected_repos[key].entry_num;
    var repo_version_index = $('#repo_version_' + repo_num)[0].selectedIndex;
    if (repositories[key].branch[repo_version_index].includes("{package}")) {
      custom_selected_repos[key] = selected_repos[key];
    } else {
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
    '  ' + ros_distro + ' default ubuntu ' + os_version + ' amd64 \\<br/>';
  if (non_custom_selected_repo_names.length > 0) {
    msg += '  ' + non_custom_selected_repo_names.join(' ') + ' \\<br/>';
  }
  for (var repo_name in custom_selected_repos) {
    if (!custom_selected_repos.hasOwnProperty(repo_name)) {
      continue;
    }
    var repo_num = custom_selected_repos[repo_name].entry_num;
    var repo_version_index = $('#repo_version_' + repo_num)[0].selectedIndex;
    var packages = repositories[repo_name].package_names[repo_version_index];
    var branch = repositories[repo_name].branch[repo_version_index];
    var vcs = repositories[repo_name].vcs[repo_version_index];
    var url = repositories[repo_name].url[repo_version_index];
    for (var j = 0; j < packages.length; j++) {
      var package_name = packages[j];
      var package_specific_branch = branch.replace("{package}", package_name);
      msg +=
        '  --custom-repo ' +
        package_name + ':' + vcs + ':' + url + ':' + package_specific_branch + ' \\<br/>';
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
  // Add handler for next action clicked on the wizard
  $('#prerelease_wizard').on('actionclicked.fu.wizard', function(evt, data) {
    console.log(data);
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
