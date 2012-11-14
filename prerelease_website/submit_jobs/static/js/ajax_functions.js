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
  var repo_selects = $("#submit_job_form").find(".repo_select");
  var version_selects = $("#submit_job_form").find(".version_select");

  repo_list = []
  for(var i=0; i < repo_selects.length; ++i)
  {
      console.log(repo_selects[i].id + ": " + repo_selects[i].value);
      console.log(version_selects[i].id + ": " + version_selects[i].value);
      repo_list.push({'repo': repo_selects[i].value, 'version': version_selects[i].value});
  }
  var email = $("#email").val();
  var ros_distro = repositories[repo_list[0]['repo']]['distro'];
  console.log("E-mail: " + email);
  console.log("ROS Distro: " + ros_distro);


  // redirect to new view
  run_jobs(email, ros_distro, repo_list);
}



function run_jobs(email, ros_distro, repo_list)
{
  Dajaxice.submit_jobs.run_job_ajax(run_jobs_cb, {'ros_distro': ros_distro,
						  'email': email,
						  'repositories': repo_list});
}

function run_jobs_cb(data)
{
  console.log("Job submitted");
}



function on_email(email) { 
    // check if email is valid
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    // enable sumbit button
    if (re.test(email))
	$("#btn_submit").attr("disabled", false);
    else
	$("#btn_submit").attr("disabled", "disabled");
}



function get_version(select_id)
{
    // find repo name
    var id = select_id.split('_')[1];
    var repo = $("#select_"+id).val();

    // add versions to dropdown menu
    $("#version_"+id).find('option[value!=""]').remove();
    for (var i=0; i<repositories[repo]['version'].length; i++){
	var version = repositories[repo]['version'][i];
	$("#version_"+id).append("<option value="+version+">"+version+"</option>")	
    }

    // set default value
    get_version_description("select_"+id, 0);  
}


function get_version_description(select_id, version)
{
    // find repo name
    var id = select_id.split('_')[1];
    var repo = $("#select_"+id).val();

    // find id of selected version
    var version_id = 0;
    for (var i=0; i<repositories[repo]['version'].length; i++)
	if (repositories[repo]['version'][i] == version)
	    version_id = i;

    // get url / branch of selected version
    var url = repositories[repo]['url'][version_id];
    var branch = repositories[repo]['branch'][version_id];
    if (branch != "")
	url = url + " --> " + branch
    $('#description_' + id).html(url);
}



function select_repositories(id, distro_select)
{
    keys = new Array();
    
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
		keys.push(repo);
    }
    
    
    // add in sorted order
    keys.sort();
    for (var i=0; i<keys.length; i++)
	$("#select_"+id).append("<option value="+keys[i]+">"+keys[i]+"</option>")
    
    
    // set default value
    get_version("select_"+id);
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
    if ($(this).attr('id') && $(this).attr('id').indexOf('_') != -1)
	$(this).attr('id', $(this).attr('id').split('_')[0] + '_' + new_num);
  });

  // insert the new element after the last "duplicatable" input field
  $('#div_' + num).after(new_elem);

  $('#version_' + new_num).html('');
  $('#description_' + new_num).html('');

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
