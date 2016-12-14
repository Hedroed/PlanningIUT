$(function(){

    $("#saveGroup").on("click", function(e){
        e.preventDefault();
        var sel = $("#selectGroup option:selected").text();
        console.log("save "+sel);
        $("#side-checkbox").prop('checked', false);

        var d = new Date();
        d.setMonth(d.getMonth() + 3);
        console.log(d);

        document.cookie = "group="+ sel +"; expires="+ d;
    });

    $("#up-icon").on("click", function(e){
        $('.courses').animate({ scrollTop: 0 }, 'slow');
    });


});
