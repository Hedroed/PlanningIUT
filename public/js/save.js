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

    $("#selectDeps").on("change", function(e){
        var select = $("#selectDeps option:selected").text();
        $("#selectGroup option").each(function(i, e) {
            $(e).addClass("hide");
        });
        $("#selectGroup option[dep="+select+"]").each(function(i, e) {
            $(e).removeClass("hide");
        });
    });

    $("#up-icon").on("click", function(e){
        $('.courses').animate({ scrollTop: 0 }, 'slow');
    });

    $('.courses').scroll(function(){
        if($('.courses').scrollTop() > 1) {
            $("#bg-scroll").addClass("active");
        }
        else {
            $("#bg-scroll").removeClass("active");
        }
    });


});
