function Simulation() {
    /*drawing offset*/
    let scale;
    let xOffset = 0;
    let yOffset = 0;
    let dragMode = 0;//0==none, 1=world, 2=vernier, 3= object

    let mx, my; //prev mouse positions
    let bgColor = "rgb(0,64,84)";
    let fgColor = "orange";//rgb(255,255,255)";

    let loadedItems = 0;
    const itemsToLoad = 4;
//gauge variables
    let imgThimble;
    let imgSpindle;
    let imgBase;
    let imgTexture;
    let textPattern = null;
    let gradient = null;

    let tickSound;

    const scaleOriginX = 539;
    const scaleOriginY = 100;

    const spindleOriginX = 200;
    const spindleOriginY = 79;

    const thimbleY1 = 49;
    const thimbleY2 = 40;
    const thimbleY3 = 31;
    const thimbleX1 = 0; //thimble leftmost pos in  thimble.png
    const thimbleX2 = 40; //thimbal division display location in thimble.png
    const thimbleX3 = 440; //thimble leftmost pos in  thimble.png
    const unit = "mm";

    const mainScaleLengthPixels = 200;

    const majorTickLengthPixels = 20;
    const minorTickLengthPixels = 10;
    const vernierMajorTickLengthPixels = 30;
    const vernierMinorTickLengthPixels = 18;
    const scaleColor = "black";

    let mainScaleDivisions = 30;
    let msd_pixels = mainScaleLengthPixels / mainScaleDivisions;
    let msdValue = 0.5;
    let circularScaleDivisions = 50;
    let msr = 0;
    let csr = 0;
    let zeroError = 0;
    let displayInfo = true;
    let objectWidthPixel = 25;

    let precision;
    let randomZeroError = true;
    let randomMainScaleDivisions = true;
    let randomCircularScaleDivision = true;
    let randomObjectWidthPixel = true;
    let objectTobeMeasured = {
        x: xOffset + window.innerWidth - 100,
        y: yOffset + window.innerHeight - 110,
        w: 30,
        h: 100,
        state: 1
    };//state =0=hide, 1= visible but not snapped, 2=snapped


    let canvas, ctx;


    function itemloaded() {
        loadedItems++;
        if (loadedItems == itemsToLoad) {

            canvas.addEventListener("mousewheel", mouseWheelMoved);
            window.addEventListener('keydown', onKeyEvent, false);
            canvas.addEventListener("mousemove", mouseDragged);
            canvas.addEventListener("mousedown", mousePressed);
            canvas.addEventListener("mouseup", mouseReleased);
            canvas.addEventListener("touchstart", myTouchStart, false);	// touch handler for iPhones, iPads, and Androids
            canvas.addEventListener("touchmove", myTouchMove, false);	// touch handler for iPhones, iPads, and Androids
            canvas.addEventListener("touchend", myTouchEnd, false);		// touch handler for iPhones, iPads, and Androids
            window.addEventListener('keydown', onKeyEvent, false);
            createProblem();
        }
        paint();
    }

    function resize() {
        if (window.innerWidth < 10 || window.innerHeight < 10) return;
        scale = canvas.width/1200;
        //canvas.width = window.innerWidth-10;
        //canvas.height = window.innerHeight-10;
        update();
    }


    function initialize(c, dirurl) {
        imgThimble = new Image();
        imgThimble.src = dirurl + "/" + "thimble.png"
        imgThimble.onload = itemloaded;
        imgSpindle = new Image();
        imgSpindle.src = dirurl + "/" + "spindle.png"
        imgSpindle.onload = itemloaded;
        imgBase = new Image();
        imgBase.src = dirurl + "/" + "micrometer_base.png"
        imgBase.onload = itemloaded;
        imgTexture = new Image();
        imgTexture.src = dirurl + "/" + "texture9.png"
        imgTexture.onload = itemloaded;


        tickSound = new Audio(dirurl + "/" + "tick.wav");
        tickSound.onload = itemloaded;
        canvas = c;
        scale = canvas.width / 1500;
        ctx = canvas.getContext("2d");
        ctx.font = "30px Arial";
        resize();
    }

    function createProblem() {
        if (randomCircularScaleDivision) circularScaleDivisions = (1 + Math.round(Math.random() * 3)) * 25;
        if (randomZeroError) zeroError = Math.round(2 * circularScaleDivisions * (Math.random() - 0.5));
        if (randomMainScaleDivisions) mainScaleDivisions = 10 * (1 + Math.round(4 * Math.random()));
        if (randomObjectWidthPixel) objectWidthPixel = mainScaleLengthPixels * (1 + 5 * Math.random()) / 10;
        objectTobeMeasured.state = 1;
        objectTobeMeasured.w = objectWidthPixel;
        //objectTobeMeasured.x=xOffset+canvas.width-objectTobeMeasured.w-10;
        //objectTobeMeasured.y=yOffset+canvas.height-objectTobeMeasured.h-10;
        if (Math.abs(objectTobeMeasured.x - spindleOriginX) < 200 && Math.abs(objectTobeMeasured.y - scaleOriginY + objectTobeMeasured.h / 2) < objectTobeMeasured.h / 2 + 50) {
            objectTobeMeasured.x = spindleOriginX;
            objectTobeMeasured.y = scaleOriginY - objectTobeMeasured.h / 2;
            objectTobeMeasured.state = 2;
        } else if (objectTobeMeasured.x > window.innerWidth - objectTobeMeasured.w || objectTobeMeasured.y > window.innerHeight - objectTobeMeasured.w || objectTobeMeasured.x < objectTobeMeasured.w / 2 || objectTobeMeasured.y < -objectTobeMeasured.h / 2) {
            objectTobeMeasured.x = canvas.width - objectTobeMeasured.w - 20;
            objectTobeMeasured.y = canvas.width - objectTobeMeasured.h - 20
        }
        //  pane.refresh();

        rotateVernier(0);
    }

    function rotateVernier(div) {
        csr += div;
        if (csr < 0) {
            csr = circularScaleDivisions + csr;
            msr -= 1;

        } else if (csr >= circularScaleDivisions) {
            csr = csr - circularScaleDivisions;
            msr += 1;

        }
        let correctedReading = getCorrectedReading();

        if (correctedReading <= 0) {
            msr = 0;
            csr = 0;
            tickSound.muted = false;
            if (tickSound.paused) tickSound.play();
        }
        if (correctedReading >= mainScaleDivisions * msdValue) {
            msr = mainScaleDivisions;
            csr = 0;
            tickSound.muted = false;
            if (tickSound.paused) tickSound.play();
        }
        if (objectWidthPixel != 0) {
            //if(msr*circularScaleDivisions+csr)*mainScaleLengthPixels
        }
        update();
    }

    function update() {
        msd_pixels = mainScaleLengthPixels / mainScaleDivisions;
        precision = (circularScaleDivisions % 3 == 0 || circularScaleDivisions % 7 == 0) ? 3 : 2;

        if (objectTobeMeasured.state == 2) {
            let v = (msr + csr / circularScaleDivisions) * msd_pixels
            if (v < objectTobeMeasured.w) {
                msr = Math.floor(objectTobeMeasured.w / msd_pixels);
                csr = Math.floor((objectTobeMeasured.w / msd_pixels - msr) * circularScaleDivisions);
                if (tickSound.paused) tickSound.play();
            }
        }
        paint();
    }


    function paint() {
        //	ctx.clear();

        ctx.fillStyle = bgColor;
        ctx.strokeStyle = fgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (loadedItems < itemsToLoad) {
            ctx.font = "30px Arial";
            ctx.fillStyle = fgColor;
            outString(canvas.width / 2, canvas.height / 2, "Loading ..." + (loadedItems * 100 / itemsToLoad).toFixed(0) + "%", 1, 1);
            return;
        }
        ctx.scale(scale, scale);
        ctx.translate(xOffset, yOffset);
        ctx.save();

        //draw  Spindle first
        let shift = (msr + csr / circularScaleDivisions) * msd_pixels;
        ctx.drawImage(imgSpindle, spindleOriginX + shift, spindleOriginY);

        //draw Base of gauge
        ctx.drawImage(imgBase, 0, 0);

        //draw ruler on main scale
        ctx.translate(scaleOriginX, scaleOriginY);
        //Rectangle2D.Double rect = new Rectangle2D.Double(Xoffset,Yoffset,mainscaleWidth,mainscaleHeight);
        ctx.fillStyle = scaleColor;//"rgb(210,210,210)";
        ctx.strokeStyle = scaleColor;
        let x = -msd_pixels * zeroError / circularScaleDivisions, y = 0, ticklength = 0;
        ctx.font = '8pt sans-serif';
        //ctx.strokeStyle="orange";
        let drawLowerTicks = mainScaleDivisions > 20;
        for (let i = 0; i <= mainScaleDivisions; i++) {
            ticklength = (i % 5 == 0) ? majorTickLengthPixels : minorTickLengthPixels;
            if (drawLowerTicks && i % 2 == 1) ticklength = -minorTickLengthPixels;
            drawLine(x, y, x, y - ticklength);
            if (i % 10 == 0) outString(x, (y - ticklength - 3), i * msdValue, 1, 2);
            x += msd_pixels;
        }

        ctx.restore();
        ctx.save();

        ctx.fillStyle = "rgb(156,172,156)";
        ctx.font = '12pt sans-serif';

        //ctx.translate(scaleOriginX+shift,scaleOriginY)
        outString(300, 465, "1 MSD = pitch = " + msdValue + unit, 1, 1);
        ctx.fillStyle = "orange";
        outString(300, 488, "www.simphy.com", 1, 1);


        //draw Circular scale
        let N = circularScaleDivisions / 4;
        let R = scaleOriginY - thimbleY1;
        ctx.drawImage(imgThimble, scaleOriginX + shift, thimbleY3);
        ctx.rect(scaleOriginX + shift, thimbleY3, (thimbleX3 - thimbleX2 - 153), 2 * (scaleOriginY - thimbleY3 - 1));
        // ctx.clip();
        if (textPattern == null) {
            textPattern = ctx.createPattern(imgTexture, 'repeat');
        }

        let offsetY = (msr * circularScaleDivisions + csr) * R * Math.PI / N / 2;
        let s = 1;
        ctx.fillStyle = textPattern;
        ctx.scale(s, s);
        ctx.translate(scaleOriginX + shift + thimbleX2 + 49, scaleOriginY + offsetY / s);

        R = scaleOriginY - thimbleY3;

        ctx.fillRect(0, -(R + offsetY) / s, (thimbleX3 - thimbleX2 - 153) / s, 2 * R / s);
        //ctx.fillRect(0,-4*(scaleOriginY-thimbleY3-1)/s,(thimbleX3-thimbleX2-153)/s,4*(scaleOriginY-thimbleY3-1)/s);

        ctx.restore();
        // ctx.clip=null;
        ctx.save();
        if (gradient == null) {
            gradient = ctx.createLinearGradient(thimbleX2, thimbleY3, thimbleX2, thimbleY3 + 2 * R);
            gradient.addColorStop(0, "black");//rgb(46,57,46)");
            gradient.addColorStop(0.5, "rgb(184,203,184)");
            gradient.addColorStop(1, "black");//rgb(46,57,46)");
        }

        x = scaleOriginX + shift;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = gradient;
        ctx.fillRect(x + thimbleX2 + 49, thimbleY3, (thimbleX3 - thimbleX2 - 153), 2 * R);
        ctx.globalAlpha = 1;


        ctx.fillStyle = scaleColor;
        ctx.strokeStyle = scaleColor;
        //draw Divisions on circular scale
        //ctx.translate(scaleOriginX+shift,scaleOriginY); //translate origin to circular scale zero
        x = scaleOriginX + shift;
        y = scaleOriginY;
        ctx.font = '9pt sans-serif';

        R = scaleOriginY - thimbleY1;
        let dy1 = 0, dy2 = 0;
        let dth = Math.PI / 2 / N;
        let divPos;
        let sinTh = 0
        let csrWithZE = getCircularScaleReading();
        drawLine(x, thimbleY1 - 1, x, thimbleY1 + 2 * R + 1);
        for (let i = 0; i < N; i++) {
            sinTh = Math.sin(i * dth);
            if (sinTh > 0.7) ctx.globalAlpha = 1 - 3 * (sinTh - 0.7)
            dy1 = R * sinTh;
            dy2 = dy1 * (R + 4) / R;
            y = scaleOriginY - dy1;
            divPos = mod(csrWithZE + i, circularScaleDivisions);
            ticklength = vernierMinorTickLengthPixels;
            if (divPos % 5 == 0) {
                ticklength = vernierMajorTickLengthPixels;
                dy2 = dy1 * (R + 8) / R;
                if (i < N - 2) outString(x + thimbleX2 + 5, scaleOriginY - dy2, divPos, 0, 1);
            }
            drawLine(x, y, x + ticklength, scaleOriginY - dy2);
            if (i == 0) continue;
            dy2 = dy1 * (R + 4) / R;
            y = scaleOriginY + dy1;
            divPos = mod(csrWithZE - i, circularScaleDivisions);
            ticklength = vernierMinorTickLengthPixels;
            if (divPos % 5 == 0) {
                ticklength = vernierMajorTickLengthPixels;
                dy2 = dy1 * (R + 8) / R;
                if (i < N - 2) outString(x + thimbleX2 + 5, scaleOriginY + dy2, divPos, 0, 1);
            }
            drawLine(x, y, x + ticklength, scaleOriginY + dy2);
        }
        ctx.restore();
        ctx.fillStyle = fgColor;
        ctx.font = '12pt sans-serif';

        if (objectTobeMeasured.state > 0) {
            let grd = ctx.createLinearGradient(objectTobeMeasured.x, objectTobeMeasured.y, objectTobeMeasured.x + objectTobeMeasured.w, objectTobeMeasured.y);
            grd.addColorStop(0, "rgb(120,120,120)")
            grd.addColorStop(0.5, "rgb(220,230,210)")
            grd.addColorStop(1, "rgb(120,120,120)")
            ctx.fillStyle = grd;
            ctx.fillRect(objectTobeMeasured.x + 1, objectTobeMeasured.y, objectTobeMeasured.w, objectTobeMeasured.h);
            ctx.strokeStyle = scaleColor;
            ctx.strokeRect(objectTobeMeasured.x + 1, objectTobeMeasured.y, objectTobeMeasured.w, objectTobeMeasured.h);
            ctx.fillStyle = fgColor;
        }

        if (displayInfo) drawInfo();
        ctx.resetTransform();

        // ctx.drawImage(imgSimphy,5,5,100,30);
    }

    function drawInfo() {
        //draw MSD Info and CSD Info
        ctx.lineWidth = 1.5;
        ctx.fillStyle = fgColor;
        ctx.strokeStyle = fgColor;
        //dra MSD Hint
        let x = scaleOriginX - msd_pixels * zeroError / circularScaleDivisions + getMainScaleReading() * msd_pixels;
        let y = scaleOriginY + 2 + minorTickLengthPixels;
        let arrowSize = 5;
        drawLineWithArrows(x, y, x, y + 50, arrowSize, arrowSize, true, false);
        outString(x, y + 53, getMainScaleReading() + "MSD = " + formatValue(getMainScaleReading() * msdValue), 1, 0);

        //Draw CSD Hint
        let gappixel = msd_pixels * (msr + csr / circularScaleDivisions);
        x = scaleOriginX + gappixel + thimbleX2;
        y = scaleOriginY;
        drawLineWithArrows(x, y, x + 40, y, arrowSize, arrowSize, true, false);
        outString(x + 47, y, getCircularScaleReading() + "CSD = " + formatValue(msdValue * getCircularScaleReading() / circularScaleDivisions), 0, 1);

        //Draw SCrew gauge Reading
        x = spindleOriginX - 1;
        y = spindleOriginY - 20;
        drawLineWithArrows(x - 30, y, x, y, arrowSize, arrowSize, false, true);
        x = spindleOriginX + gappixel + 3;
        y = spindleOriginY - 20;
        drawLineWithArrows(x, y, x + 30, y, arrowSize, arrowSize, true, false);
        let mr = getMeasuredReading();
        let cr = getCorrectedReading();
        let ze = getZeroError();
        y = spindleOriginY - 42;
        x = spindleOriginX + gappixel / 2;
        if (ze == 0) {
            outString(x, y, formatValue(cr), 1, 1);
        } else if (ze > 0) {
            outString(x, y, formatValue(mr) + ' - ' + formatValue(ze) + " = " + formatValue(cr), 1, 1);
        } else {
            outString(x, y, formatValue(mr) + ' + ' + formatValue(-ze) + " = " + formatValue(cr), 1, 1);
        }


        /*
        let objw=(objectTobeMeasured.w/msd_pixels)*msdValue;
        outString(20, 550," msr="+getMainScaleReading()+"  csr="+getCircularScaleReading(),0,2);
        outString(20, 575,"Measured Reading="+mr.toFixed(3)+" ZeroError="+ze.toFixed(3)+ " Corrected Reading ="+cr.toFixed(3),0,2);
        outString(20, 625,"Obj Width pixels="+objectTobeMeasured.w.toFixed(3)+"pixels , msd in pixels =  "+msd_pixels.toFixed(3)+" cm",0,2);
        outString(20, 600,"Actual Object Width = ="+objw.toFixed(3),0,2);
        */
    }


    function getZeroError() {
        return (zeroError / circularScaleDivisions) * msdValue;
    }

    function formatValue(s) {
        return s.toFixed(precision) + unit;
    }

    function getMainScaleReading() {
        return Math.floor((msr * circularScaleDivisions + csr + zeroError) / circularScaleDivisions);
    }

    function getCircularScaleReading() {
        return mod(csr + zeroError, circularScaleDivisions);
    }

    function getMeasuredReading() {
        return getCorrectedReading() + getZeroError();
    }

    function getCorrectedReading() {
        return (msr + csr / circularScaleDivisions) * msdValue;
    }


    /**
     * returns +ve remainder whn a is divided by n
     * */
    function mod(a, n) {
        return ((a % n) + n) % n;
    }

    function drawLine(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

// x0,y0: the line's starting point
// x1,y1: the line's ending point
// width: the distance the arrowhead perpendicularly extends away from the line
// height: the distance the arrowhead extends backward from the endpoint
// arrowStart: true/false directing to draw arrowhead at the line's starting point
// arrowEnd: true/false directing to draw arrowhead at the line's ending point
    function drawLineWithArrows(x0, y0, x1, y1, aWidth, aLength, arrowStart, arrowEnd) {
        let dx = x1 - x0;
        let dy = y1 - y0;
        let angle = Math.atan2(dy, dx);
        let length = Math.sqrt(dx * dx + dy * dy);
        //
        ctx.save();
        ctx.translate(x0, y0);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(length, 0);
        if (arrowStart) {
            ctx.moveTo(aLength, -aWidth);
            ctx.lineTo(0, 0);
            ctx.lineTo(aLength, aWidth);
        }
        if (arrowEnd) {
            ctx.moveTo(length - aLength, -aWidth);
            ctx.lineTo(length, 0);
            ctx.lineTo(length - aLength, aWidth);
        }
        //
        ctx.stroke();
        ctx.restore();
    }

    function outString(x, y, s, x_align, y_align) {
        let fm = ctx.measureText(s);
        let h = 10;//fm.height not supported in browsers
        switch (y_align) {
            case 0:
                y += h;
                break;
            case 1:
                y += h / 2;
                break;
            case 2:
                break;
        }
        switch (x_align) {
            case 0:
                ctx.fillText(s, x + 3, y);
                break;
            case 1:
                ctx.fillText(s, x - fm.width / 2, y);
                break;
            case 2:
                ctx.fillText(s, x - fm.width / 2, y);
                break;
        }
    }


    function myTouchMove(te) {
        te.preventDefault();
        let touch = te.touches[0];
        let mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }

    function myTouchStart(te) {
        te.preventDefault();
        let touch = te.touches[0];
        let mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }

    function myTouchEnd(te) {
        te.preventDefault();
        let touch = te.touches[0];
        let mouseEvent = new MouseEvent("mouseup", {
            clientX: touch ? touch.clientX : -1,
            clientY: touch ? touch.clientY : -1,
        });
        canvas.dispatchEvent(mouseEvent);
    }

    function getMousePos(event) {
        //let rect = canvas.getBoundingClientRect();
        return [event.clientX, event.clientY];
    }

    function mousePressed(me) {
        let m = getMousePos(me);

        //convert mouse pos in world coordinates taking translation and scale in account
        let x = m[0] / scale - xOffset;
        let y = m[1] / scale - yOffset;
        console.log("mousepressed at " + x + "," + y)
        let shift = scaleOriginX + (msr + csr / circularScaleDivisions) * msd_pixels;
        if (x > shift + thimbleX2 && x < shift + thimbleX3 && y > thimbleY3 && y < thimbleY3 + 2 * (scaleOriginY - thimbleY3)) {
            dragMode = 2;
        } else if (objectTobeMeasured.state > 0 && x > objectTobeMeasured.x && x < objectTobeMeasured.x + objectTobeMeasured.w && y > objectTobeMeasured.y && y < objectTobeMeasured.y + objectTobeMeasured.h) {
            dragMode = 3;
            objectTobeMeasured.state = 1;
        } else {
            dragMode = 1;
        }
        paint();
        mx = m[0];
        my = m[1];
        me.preventDefault();
    }

    function mouseReleased(me) {
        if (dragMode == 3) { //move object
            if (Math.abs(objectTobeMeasured.x - spindleOriginX) < 200 && Math.abs(objectTobeMeasured.y - scaleOriginY + objectTobeMeasured.h / 2) < objectTobeMeasured.h / 2 + 50) {
                objectTobeMeasured.x = spindleOriginX;
                objectTobeMeasured.y = scaleOriginY - objectTobeMeasured.h / 2;
                objectTobeMeasured.state = 2;
            }
            update();
        }
        dragMode = 0;
    }

    function mouseWheelMoved(me) {
        //console.log(e.wheelDelta);
        let scroll = me.wheelDelta > 0 ? 1 : -1;
        rotateVernier(scroll);
        me.preventDefault();
    }

    function mouseDragged(me) {
        if (dragMode == 0) return false;
        let m = getMousePos(me);
        //console.log(m);
        let dx, dy;
        dx = (m[0] - mx) / scale;
        dy = (m[1] - my) / scale;
        mx = m[0];
        my = m[1];
        if (dragMode == 1) { //move scene
            xOffset += dx;
            yOffset += dy;
            paint();
        } else if (dragMode == 3) { //move object
            objectTobeMeasured.x += dx;
            objectTobeMeasured.y += dy;
            paint();
        } else if (dragMode == 2) { //move vernier
            if (msr >= mainScaleDivisions && dy > 0) {
                paint();
                return;
            }
            if (msr == 0 && csr == 0 && (dy < 0)) {
                paint();
                return;
            }
            rotateVernier(Math.round(dy));
        } else {//move object

        }

        //update();
        me.preventDefault();
    }


    /**
     * Runs when widget recieves key event (events are similar to java.awt events).
     * @param keyChar {char} : the character(if any) associated with keyevent
     * @param keyCode {Number} : key code {@see https://docs.oracle.com/javase/7/docs/api/java/awt/event/KeyEvent.html} for keycodes
     * @param key {String} : the identifier of the key (like 'ArrowLeft','a','Enter','F11) that was pressed when a key event occured
     * @param id {Number} : EventType 401(keyPressed), 402(KeyReleased)
     * @return if true is returned event is consumed and not further handled by simphy world*/
    function onKeyEvent(e) {
        //if(id==401){
        if (e.keyCode == 37 || e.keyCode == 38) {
            rotateVernier(-1);
        } else if (e.keyCode == 39 || e.keyCode == 40) {
            rotateVernier(1);
        } else if (e.keyCode == 33) {//page up
            scale *= 1.05;
            update();
        } else if (e.keyCode == 34) {//page down
            scale *= 0.96195;
            update();
        } else {
            return false;
        }

        e.preventDefault();
    }
    return initialize;
}