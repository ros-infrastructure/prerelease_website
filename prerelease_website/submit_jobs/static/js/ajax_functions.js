function get_repo_list()
{
  repo_list = new Array()
  var repo_selects = $("#submit_job_form").find(".repo_select");
  for(var i=0; i < repo_selects.length; ++i)
  {
    if(repo_selects[i].value != 0)
      repo_list.push(repo_selects[i].value);
  }
  return repo_list;
}




function submit_jobs()
{
  var email = $("#email");
  console.log(email);
  console.log("E-mail: " + email.val());
  repo_list = []
  var repo_selects = $("#submit_job_form").find(".repo_select");
  var version_selects = $("#submit_job_form").find(".version_select");
  for(var i=0; i < repo_selects.length; ++i)
  {
    if(repo_selects[i].value != 0)
    {
      console.log(repo_selects[i].id + ": " + repo_selects[i].value);
      console.log(version_selects[i].id + ": " + version_selects[i].value);
      repo_list.push({'repo': repo_selects[i].value, 'version': version_selects[i].value});
    }
  }
  Dajaxice.submit_jobs.submit_job(submit_cb, {'repositories': repo_list});
}

function submit_cb(data)
{
  console.log("Job submitted");
}

function get_version(select_id, repo, distro)
{
    var id = select_id.split('_')[1]
    $('#version_' + id).hide()
    $('#description_' + id).hide()
    $('#loader_' + id).show()
    Dajaxice.submit_jobs.get_version(version_cb, {'id_num':id, 'repo':repo, 'distro':distro});
}

function get_version_description(version_id)
{
  var id = version_id.split('_')[1]
  //Only show the description that corresponds to the selected
  //version number
  $('#description_' + id).children().each(function () {
    if($(this).attr('name') == $('#version_' + id).val())
      $(this).show();
    else
      $(this).hide();
  });
}

function version_cb(data)
{
  $('#version_' + data.id).html(data.select_innerHTML);
  $('#description_' + data.id).html(data.descriptions);
  $('#loader_' + data.id).hide();
  $('#version_' + data.id).show();

  //Only show the description that corresponds to the selected
  //version number
  get_version_description('#version_' + data.id);
  $('#description_' + data.id).show();
}


function select_repositories(id, distro_select)
{
  $("#select_"+id).find('option[value!=""]').remove();
  skip_list = get_repo_list();
  for (var repo in repositories){
    var duplicate = false
      for (var i=0; i<skip_list.length; i++){
	  if (repo == skip_list[i])
	      duplicate = true
      }
      if (!distro_select || repositories[repo]['distro'] == distro_select)
	  if (!duplicate)
	      $("#select_"+id).append("<option value="+repo+">"+repo+"</option>")
  }
};


function add_dropdown() {
  var num = $('.cloned_div').length; // how many "duplicatable" input fields we currently have
  var new_num  = new Number(num + 1);      // the numeric ID of the new input field being added

  // disable previous dropdown
  $('#select_'+num).attr('disabled','disabled');

  // create the new element via clone(), and manipulate it's ID using newNum value
  var new_elem = $('#div_' + num).clone().attr('id', 'div_' + new_num);

  // manipulate the name/id values of the input inside the new element
  new_elem.children().each(function () {
    $(this).attr('id', $(this).attr('id').split('_')[0] + '_' + new_num);
  });

  // insert the new element after the last "duplicatable" input field
  $('#div_' + num).after(new_elem);

  $('#version_' + new_num).html('');
  $('#description_' + new_num).html('');
  $('#description_' + new_num).hide();

  var repo_selects = $("#submit_job_form").find(".repo_select");
  select_repositories(new_num, repositories[repo_selects[0].value]['distro']);

  // enable the "remove" button
  $('#btn_del').attr('disabled',false);

  $('#select_'+new_num).attr('disabled', false);

  // business rule: you can only add 5 names
  if (new_num == 15)
    $('#btn_add').attr('disabled','disabled');
}

function delete_dropdown()
{
  var num = $('.cloned_div').length; // how many "duplicatable" input fields we currently have
  $('#div_' + num).remove();     // remove the last element

  // enable the "add" button
  $('#btn_add').attr('disabled',false);

  $('#select_'+(num-1)).attr('disabled', false);

  // if only one element remains, disable the "remove" button
  if (num-1 == 1)
    $('#btn_del').attr('disabled','disabled');
}
