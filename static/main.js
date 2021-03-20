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
    const PEN_TOOL = 'pen';
    const LINE_TOOL = 'line';
    const ARROW_TOOL = 'arrow';
    const RECT_TOOL = 'rect';
    const CIRCLE_TOOL = 'circle';

    let syncClient;
    let syncStream;
    let status = $('#status');

    let canvas = $('.whiteboard')[0];
    let mask = $(".mask")[0];

    let colorSelect = $("#pen-color");
    let sizeSelect = $("#pen-size");

    let storedLines = [];

    let penTool = $("#pen-tool");
    let lineTool = $("#line-tool");
    let arrowTool = $("#arrow-tool");
    let rectTool = $("#rect-tool");
    let circleTool = $("#circle-tool");

    let context = canvas.getContext('2d');
    let current = {
        color: colorSelect.val(),
        size: sizeSelect.val(),
        tool: "pen",
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
                switch (data.tool){
                    case CIRCLE_TOOL:
                        drawCircleWithSave(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
                        break;
                    case ARROW_TOOL:
                        drawArrowWithSave(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
                        break;
                    case RECT_TOOL:
                        drawRectWithSave(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
                        break;
                    case LINE_TOOL:
                        drawLineWithSave(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
                        break;
                    case PEN_TOOL:
                        drawLineWithSave(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
                        break;
                }
            }
        });
    });

    function drawCircle(x0, y0, x1, y1, color, size) {
        let dx = x1 - x0;
        let dy = y1 - y0;
        let radius=Math.sqrt(dx*dx+dy*dy);
        context.beginPath();
        context.arc(x0, y0, radius, 0, 2 * Math.PI);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        context.closePath();
    }

    function drawCircleWithSave(x0, y0, x1, y1, color, size, syncStream) {
        let dx = x1 - x0;
        let dy = y1 - y0;
        let radius=Math.sqrt(dx*dx+dy*dy);
        context.beginPath();
        context.arc(x0, y0, radius, 0, 2 * Math.PI);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        context.closePath();
        
        store(x0, y0, x1, y1, color,  size, CIRCLE_TOOL);
        
        if (syncStream) {
            sendData(x0, y0, x1, y1, color, size, CIRCLE_TOOL, syncStream);
        }
    }

    function drawRectWithSave(x0, y0, x1, y1, color, size, syncStream) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x0, y1);
        context.lineTo(x1, y1);
        context.lineTo(x1, y0);
        context.lineTo(x0, y0);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        context.closePath();

        store(x0, y0, x1, y1, color,  size, RECT_TOOL);
        
        if (syncStream) {
            sendData(x0, y0, x1, y1, color, size, RECT_TOOL, syncStream);
        }
    }    

    function drawRect(x0, y0, x1, y1, color, size) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x0, y1);
        context.lineTo(x1, y1);
        context.lineTo(x1, y0);
        context.lineTo(x0, y0);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        context.closePath();
    }

    function drawArrowWithSave(x0, y0, x1, y1, color, size, syncStream) {
        let headlen = size*5; // length of head in pixels
        let dx = x1 - x0;
        let dy = y1 - y0;
        let angle = Math.atan2(dy, dx);
        let length=Math.sqrt(dx*dx+dy*dy);
        context.translate(x0,y0);
        context.rotate(angle);
        context.beginPath();
        context.moveTo(0,0);
        context.lineTo(length,0);
        context.moveTo(length-headlen,-(size*2));
        context.lineTo(length,0);
        context.lineTo(length-headlen,size*2);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        
        context.setTransform(1,0,0,1,0,0);

        store(x0, y0, x1, y1, color,  size, ARROW_TOOL);

        if (syncStream) {
            sendData(x0, y0, x1, y1, color, size, ARROW_TOOL, syncStream);
        }

    }

    function drawArrow(x0, y0, x1, y1, color, size) {
        let headlen = size*5; // length of head in pixels
        let dx = x1 - x0;
        let dy = y1 - y0;
        let angle = Math.atan2(dy, dx);
        let length=Math.sqrt(dx*dx+dy*dy);
        context.translate(x0,y0);
        context.rotate(angle);
        context.beginPath();
        context.moveTo(0,0);
        context.lineTo(length,0);
        context.moveTo(length-headlen,-(size*2));
        context.lineTo(length,0);
        context.lineTo(length-headlen,size*2);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        
        context.setTransform(1,0,0,1,0,0);

    }

    function drawLineWithSave(x0, y0, x1, y1, color, size, syncStream){

        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        context.closePath();
    
        store(x0, y0, x1, y1, color,  size, LINE_TOOL);
        
        if (syncStream) {
            sendData(x0, y0, x1, y1, color, size, LINE_TOOL, syncStream);
        }
    }

    function sendData(x0, y0, x1, y1, color, size, tool, syncStream) {
        let w = canvas.width;
        let h = canvas.height;
        
        syncStream.publishMessage({
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            color: color,
            size: size,
            tool: tool,
        });
    }

    function store(x0, y0, x1, y1, color, size, tool){
        storedLines.push({x0 : x0, 
            y0 : y0, 
            x1 : x1, 
            y1 : y1, 
            color : color, 
            size :  size,
            tool: tool});
    }

    function drawLine(x0, y0, x1, y1, color, size) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
        context.closePath();
    }

    function onMouseDown(e){
        drawing = true;
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function onMouseUp(e) {
        if (!drawing) { return; }
        drawing = false;
        redrawStoredLines();
        switch (current.tool){
            case CIRCLE_TOOL:
                drawCircleWithSave(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case ARROW_TOOL:
                drawArrowWithSave(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case RECT_TOOL:
                drawRectWithSave(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case LINE_TOOL:
                drawLineWithSave(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case PEN_TOOL:
                drawLineWithSave(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
        }
    }

    function onMouseMove(e) {
        if (!drawing) { return; }
        redrawStoredLines();
        
        switch (current.tool){
            case CIRCLE_TOOL:
                drawCircle(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case ARROW_TOOL:
                drawArrow(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case RECT_TOOL:
                drawRect(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case LINE_TOOL:
                drawLine(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                break;
            case PEN_TOOL:
                drawLineWithSave(current.x, current.y, e.clientX, e.clientY, current.color, current.size, syncStream);
                current.x = e.clientX;
                current.y = e.clientY;
                break;
        }

    }

    function redrawStoredLines() {
        clearBoard(context);
        if (storedLines.length == 0) {
          return;
        }
        // redraw each stored line
        for (var i = 0; i < storedLines.length; i++) {
          switch (storedLines[i].tool){
            case CIRCLE_TOOL:
                drawCircle(storedLines[i].x0, storedLines[i].y0, storedLines[i].x1, storedLines[i].y1,
                    storedLines[i].color, storedLines[i].size);
                break;
            case ARROW_TOOL:
                drawArrow(storedLines[i].x0, storedLines[i].y0, storedLines[i].x1, storedLines[i].y1,
                    storedLines[i].color, storedLines[i].size);
                break;
            case RECT_TOOL:
                drawRect(storedLines[i].x0, storedLines[i].y0, storedLines[i].x1, storedLines[i].y1,
                    storedLines[i].color, storedLines[i].size);
                break;
            case LINE_TOOL:
                drawLine(storedLines[i].x0, storedLines[i].y0, storedLines[i].x1, storedLines[i].y1,
                    storedLines[i].color, storedLines[i].size);
                break;
            case PEN_TOOL:
                drawLine(storedLines[i].x0, storedLines[i].y0, storedLines[i].x1, storedLines[i].y1,
                    storedLines[i].color, storedLines[i].size);
                break;
          }
        }
    }

    function onResize(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redrawStoredLines();
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

    function clearBoard(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
      
    function clearAll() {
        clearBoard(context);
        storedLines.length = 0;
    }

    function changeColor() {
        current.color = colorSelect.val();   // change line color
        //colorSelect.css("border", "5px solid " + current.color); // change the button border color
    }
      
    function changeSize() {
        current.size = sizeSelect.val();
    }
    
    colorSelect.on("blur", changeColor);
    sizeSelect.on("blur", changeSize);
    clearBtn.on('click', clearAll);
    penTool.on("click", function(){
        current.tool = PEN_TOOL;
    });
    lineTool.on("click", function(){
        current.tool = LINE_TOOL;
    });
    arrowTool.on("click", function(){
      current.tool = ARROW_TOOL;
    });
    rectTool.on("click", function(){
      current.tool = RECT_TOOL;
    });
    circleTool.on("click", function(){
      current.tool = CIRCLE_TOOL;
    });

    mask.addEventListener('mousedown', onMouseDown);
    mask.addEventListener('mouseup', onMouseUp);
    mask.addEventListener('mouseout', onMouseUp);
    mask.addEventListener('mousemove', throttle(onMouseMove, 10));

    window.addEventListener('resize', onResize);
    onResize();
    
});