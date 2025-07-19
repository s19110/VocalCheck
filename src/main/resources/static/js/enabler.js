
const uploadOnDrag = document.getElementById('upload-area').ondrag
const uploadOnDrop = document.getElementById('upload-area').ondrop
const uploadOnDragOver = document.getElementById('upload-area').ondragover
function enable(elementId){
    document.getElementById(elementId).style.pointerEvents = 'auto';
    document.getElementById(elementId).style.filter = null;
}

export function disable(elementId) {
    document.getElementById(elementId).style.pointerEvents = 'none';
    document.getElementById(elementId).style.filter =  'brightness(30%)';
}

export function disableFileDrop(){
    document.getElementById('upload-area').ondrag = null;
    document.getElementById('upload-area').ondrop = null;
    document.getElementById('upload-area').ondragover = null;
    disable('upload-area');
}

export function enableFileDrop() {
    document.getElementById('upload-area').ondrag = uploadOnDrag;
    document.getElementById('upload-area').ondrop = uploadOnDrop;
    document.getElementById('upload-area').ondragover = uploadOnDragOver;
    enable('upload-area');
}
