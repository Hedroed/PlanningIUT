$(function(){

    var popUpTimeout;

    $("#saveGroup").on("click", function(e){
        e.preventDefault();
        var sel = $("#selectGroup option:selected").text();
        clearTimeout(popUpTimeout);
        //console.log("save "+sel);
        //$("#side-checkbox").prop('checked', false);
        $('#pop-up p').html(sel+" sauvegardé");
        $('#pop-up').addClass("active");

        popUpTimeout = setTimeout(function() {
            $('#pop-up').removeClass("active");
        },5000);

        var d = new Date();
        d.setMonth(d.getMonth() + 3);
        // console.log(d);

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

    var checkbox = $('#side-checkbox');

    $('#reload-icon').click(function(e){
        var url = window.location.href;
        var paramIndex = url.indexOf("menu=1");
        console.log(paramIndex);
        if(checkbox.prop('checked') && paramIndex === -1) {
                if (url.indexOf('?') > -1)
                    url += '&menu=1'
                else
                    url += '?menu=1'
            window.location.href = url;
        } else if(paramIndex > -1){
            var url = window.location.href;
            url = url.substring(0,paramIndex-1);
            window.location.href = url;
        } else {
            window.location.reload(false);
        }
    });

    $('.page').swipe({
        swipe: function(event, direction, distance) {
            if(direction === "right")
                checkbox.prop('checked', true);
            else
                checkbox.prop('checked', false);

            //console.log("Swipe "+direction);
        },
        threshold: 70
    });

});
