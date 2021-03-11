$(".tool").click(function() {
  $("#pen-tool").removeClass('button-clicked');
  $("#line-tool").removeClass('button-clicked');
  $("#arrow-tool").removeClass('button-clicked');
  $("#rect-tool").removeClass('button-clicked');
  $("#circle-tool").removeClass('button-clicked');
  $("#diamond-tool").removeClass('button-clicked');
});

$("#pen-tool").click(function() {
  $("#pen-tool").addClass('button-clicked');
});
$("#line-tool").click(function() {
  $("#line-tool").addClass('button-clicked');
});
$("#arrow-tool").click(function() {
  $("#arrow-tool").addClass('button-clicked');
});
$("#rect-tool").click(function() {
  $("#rect-tool").addClass('button-clicked');
});
$("#circle-tool").click(function() {
  $("#circle-tool").addClass('button-clicked');
});
$("#diamond-tool").click(function() {
  $("#diamond-tool").addClass('button-clicked');
});


$(function () {
    let syncClient;
    let syncStream;
    let status = $('#status');
    let canvas = $('.whiteboard')[0];
    let colorSelect = $("#pen-color");
    let sizeSelect = $("#pen-size");
    let context = canvas.getContext('2d');
    let current = {
        color: colorSelect.val(),
        size: sizeSelect.val()
    };
    let drawing = false;

    let clearBtn = $('#clear-btn');

    $.getJSON('/token', function(tokenResponse) {
        syncClient = new Twilio.Sync.Client(tokenResponse.token, { logLevel: 'info' });
        syncClient.on('connectionStateChanged', function(state) {
            if (state != 'connected') {
                status.html('Sync is not live (websocket connection <span style="color: red">' + state + '</span>)...');
            } else {
                status.html('Sync is live! <span style="color: #4dff2b">&#x2688;</span>');
            }
        });


        syncClient.stream('drawingData').then(function(stream) {
            syncStream = stream;
            syncStream.on('messagePublished', function(event) {
                syncDrawingData(event.message.value);
            });

            function syncDrawingData(data){
                let w = canvas.width;
                let h = canvas.height;
                drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
            }
        });
    });

    function drawLine(x0, y0, x1, y1, color, size, syncStream){

        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        context.closePath();

        if (syncStream) {
            let w = canvas.width;
            let h = canvas.height;
            
            syncStream.publishMessage({
                x0: x0 / w,
                y0: y0 / h,
                x1: x1 / w,
                y1: y1 / h,
                color: color,
                size: size
            });
        }
    }

    function onMouseDown(e){
        drawing = true;
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function onMouseUp(e) {
        if (!drawing) { return; }
        drawing = false;
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
    }

    function onMouseMove(e) {
        if (!drawing) { return; }
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function onResize(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function throttle(callback, delay) {
        let previousCall = new Date().getTime();
        return function() {
            let time = new Date().getTime();

            if ((time - previousCall) >= delay){
                previousCall = time;
                callback.apply(null, arguments);
            }
        }
    }

    function clearBoard() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    function changeColor() {
        current.color = colorSelect.val();   // change line color
        //colorSelect.css("border", "5px solid " + current.color); // change the button border color
    }
      
    function changeSize() {
        current.size = sizeSelect.val();
    }
    
    colorSelect.on("blur", changeColor);
    sizeSelect.on("blur", changeSize);
    clearBtn.on('click', clearBoard);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseUp);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10));

    window.addEventListener('resize', onResize);
    onResize();
    
});