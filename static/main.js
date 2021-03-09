$(function () {
    let syncClient;
    let syncStream;
    let message = $('#message');
    let canvas = $('.whiteboard')[0];
    let context = canvas.getContext('2d');
    let current = {
        color: 'black'
    };
    let drawing = false;

    let colorBtn = $('#color-btn');
    let clearBtn = $('#clear-btn');

    $.getJSON('/token', function(tokenResponse) {
        syncClient = new Twilio.Sync.Client(tokenResponse.token, { logLevel: 'info' });
        syncClient.on('connectionStateChanged', function(state) {
            if (state != 'connected') {
                message.html('Sync is not live (websocket connection <span style="color: red">' + state + '</span>)...');
            } else {
                message.html('Sync is live!');
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
                drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
            }
        });
    });

    function drawLine(x0, y0, x1, y1, color, syncStream){

        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 2;
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
                color: color
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
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, syncStream);
    }

    function onMouseMove(e) {
        if (!drawing) { return; }
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, syncStream);
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
        current.color = '#' + Math.floor(Math.random() * 16777215).toString(16);  // change line color
        colorBtn.css('border', '5px solid ' + current.color);  // change the button border color
    };

    colorBtn.on('click', changeColor);
    clearBtn.on('click', clearBoard);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseUp);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10));

    window.addEventListener('resize', onResize);
    onResize();
    
});