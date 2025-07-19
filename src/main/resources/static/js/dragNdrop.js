function submitForm(ev) {
    document.getElementById('record-container').style.pointerEvents = 'none';
    document.getElementById('record-container').style.filter = 'brightness(30%)';
    document.getElementById("loading-card").classList.remove("hide");
    document.getElementById('file-input').form.submit();
}

function dragOverHandler(ev) {
    $(ev.target).removeAttr("drop-active");
    $(ev.target).attr("drop-active", true);
    ev.preventDefault();
    $("#drop-card").css("background-color", "#5a1870");
}

function leaveHover(ev) {
    $(ev.target).removeAttr("drop-active");
    $("#drop-card").css("background-color", "#4f5e82");
}

function uploadFile(ev) {
    let url = window.location.origin;
    console.log('File(s) dropped');
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                var file = ev.dataTransfer.items[i].getAsFile();
                console.log('... file[' + i + '].name = ' + file.name);
                console.log("Działam")
                parseFile(file)
                console.log("Plik powinien być przetworzony")
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
            //  let formData = new FormData()
            console.log("Działam")
            parseFile(ev.dataTransfer.files[i])
            console.log("Plik powinien być przetworzony")
        }
    }
//
    ev.preventDefault();
    leaveHover(ev);

}

function parseFile(file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fileInput = document.querySelector('input[type="file"]');
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', {bubbles: true}));
    // const url = `${window.location.origin}/upload`;
    // console.log(url);
    // return new Promise(((resolve, reject) => {
    //     const http = new XMLHttpRequest();
    //
    //     http.open("POST", url);
    //     http.onreadystatechange = () => {
    //         if (http.readyState === XMLHttpRequest.DONE && http.status === 200) {
    //             resolve(http.response);
    //         } else if (http.readyState === XMLHttpRequest.DONE && http !== 200) {
    //             $('#error-message').fadeIn().delay(3000).fadeOut();
    //             reject(http.response);
    //         }
    //     };
    //     let formData = new FormData()
    //     formData.append('file', file)
    //     http.send(formData);
    // }))

}