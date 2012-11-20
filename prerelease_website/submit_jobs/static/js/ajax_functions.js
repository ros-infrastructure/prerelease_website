
var rotation = function (image){
   $("#"+image).rotate({
      angle:0, 
      animateTo:360, 
      callback: rotation(image)
   });
}

function get_repo_list(ros_distro)
{
  Dajaxice.prerelease_website.submit_jobs.get_repo_list_ajax(get_repo_list_cb, {'ros_distro': ros_distro});
}


function get_repo_list_cb(repo_list)
{
  repositories = repo_list['repo_list'];
  console.log("Received repository list");
  list_repositories(1);
  $('#btn_add').attr('disabled', false);  
}



function run_jobs(email, ros_distro, repo_list)
{
  console.log("Run job: " + email + ", " + ros_distro);
  console.log(repo_list);
  Dajaxice.prerelease_website.submit_jobs.run_jobs_ajax(run_jobs_cb, {'ros_distro': ros_distro,
								      'email': email,
								      'repo_list': repo_list});
}

function run_jobs_cb(data)
{
  console.log("Job submitted");

  console.log(data);
  if (data['success'] == 'true'){
      console.log("Success!!!");
      $("#waiting").hide();
      $("#success").show();
      $("#output").html(data['std_out']);
  }
  else{
      console.log("Failure...");
      $("#waiting").hide();
      $("#failure").show();
      $("#output").html(data['std_err']);
  }
}

function on_form()
{
  // enable all from inputs again
  var repo_selects = $("#submit_job_form").find(".repo_select");
  for(var i=0; i < repo_selects.length; ++i)
      $("#repo_"+i).attr('disabled', false);

  // submit form
  $("#submit_job_form").submit();

  // disable form inputs again
  var repo_selects = $("#submit_job_form").find(".repo_select");
  for(var i=0; i < repo_selects.length-1; ++i)
      $("#repo_"+i).attr('disabled', 'disabled');
}

function on_email() { 
    email = $("#email").val();
    console.log("on_email: " + email);

    // check if email is valid
    if (/^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email )){
	$("#btn_submit").attr("disabled", false);
	console.log("Good email "+email);
    }
    else{
	$("#btn_submit").attr("disabled", "disabled");
	console.log("Bad email "+email);
    }
}



function get_version(repo_id)
{
    // find repo name
    var id = repo_id.split('_')[1];
    var repo = $("#repo_"+id).val();
    console.log("Get version with id " + repo_id + " of repo " + repo);

    // set ros distro (including wet/dry) based on first select
    if (id == 1){
	$("#ros_distro").val(repositories[repo]['distro']);
	console.log("Set repository to " + $("#ros_distro").val());
    }

    // add versions to dropdown menu
    $("#version_"+id).find('option[value!=""]').remove();
    for (var i=0; i<repositories[repo]['version'].length; i++){
	var version = repositories[repo]['version'][i];
	$("#version_"+id).append("<option value="+version+">"+version+"</option>")	
    }

    // set default value
    get_version_description("repo_"+id, 0);  
}


function get_version_description(repo_id, version)
{
    // find repo name
    var id = repo_id.split('_')[1];
    var repo = $("#repo_"+id).val();

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



function get_selected_repos()
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



function list_repositories(id, distro_select)
{
    console.log("list repos of type " + distro_select);

    keys = new Array();
    $("#repo_"+id).find('option[value!=""]').remove();
    skip_list = get_selected_repos();
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
	$("#repo_"+id).append("<option value="+keys[i]+">"+keys[i]+"</option>")
    
    
    // set default value
    get_version("repo_"+id);
};




function add_dropdown() {
  var num = $('.cloned_div').length; // how many "duplicatable" input fields we currently have
  var new_num  = new Number(num + 1);      // the numeric ID of the new input field being added
  console.log("create element " + new_num);

  // disable previous dropdown
  $('#repo_'+num).attr('disabled','disabled');

  // create the new element via clone(), and manipulate it's ID using newNum value
  var new_elem = $('#div_' + num).clone().attr('id', 'div_' + new_num);

  // manipulate the name/id values of the input inside the new element
  new_elem.children().each(function () {
    if ($(this).attr('id') && $(this).attr('id').indexOf('_') != -1)
	$(this).attr('id', $(this).attr('id').split('_')[0] + '_' + new_num);
    if ($(this).attr('name') && $(this).attr('name').indexOf('_') != -1)
	$(this).attr('name', $(this).attr('name').split('_')[0] + '_' + new_num);
  });

  // insert the new element after the last "duplicatable" input field
  $('#div_' + num).after(new_elem);

  $('#version_' + new_num).html('');
  $('#description_' + new_num).html('');

  list_repositories(new_num, $("#ros_distro").val());

  // enable the "remove" button
  $('#btn_del').attr('disabled',false);

  $('#repo_'+new_num).attr('disabled', false);

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

  $('#repo_'+(num-1)).attr('disabled', false);

  // if only one element remains, disable the "remove" button
  if (num-1 == 1)
    $('#btn_del').attr('disabled','disabled');
}
