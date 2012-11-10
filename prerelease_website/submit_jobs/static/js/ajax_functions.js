function get_version(select_id, repo, distro)
{
  var id = select_id.split('_')[1]
  $('#version_' + id).hide()
  $('#loader_' + id).show()
  Dajaxice.submit_jobs.get_version(version_cb, {'id_num':id, 'option':repo, 'distro':distro});
}

function version_cb(data)
{
  console.log(data);
  $('#version_' + data.id).html(data.select_innerHTML);
  $('#loader_' + data.id).hide();
  $('#version_' + data.id).show();
}

function add_dropdown() {
  var num = $('.cloned_div').length; // how many "duplicatable" input fields we currently have
  console.log(num)
  var new_num  = new Number(num + 1);      // the numeric ID of the new input field being added

  // create the new element via clone(), and manipulate it's ID using newNum value
  var new_elem = $('#div_' + num).clone().attr('id', 'div_' + new_num);

  // manipulate the name/id values of the input inside the new element
  new_elem.children().each(function () {
    $(this).attr('id', $(this).attr('id').split('_')[0] + '_' + new_num);
  });

  // insert the new element after the last "duplicatable" input field
  $('#div_' + num).after(new_elem);

  $('#version_' + new_num).html('');

  // enable the "remove" button
  $('#btn_del').attr('disabled',false);

  // business rule: you can only add 5 names
  if (new_num == 5)
    $('#btn_add').attr('disabled','disabled');
}

function delete_dropdown()
{
  var num = $('.cloned_div').length; // how many "duplicatable" input fields we currently have
  $('#div_' + num).remove();     // remove the last element

  // enable the "add" button
  $('#btn_add').attr('disabled',false);

  // if only one element remains, disable the "remove" button
  if (num-1 == 1)
    $('#btn_del').attr('disabled','disabled');
}
