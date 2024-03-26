function viewImage1(event) {
    document.getElementById('imgView1').src = URL.createObjectURL(event.target.files[0])
}

function viewImage2(event) {
    document.getElementById('imgView2').src = URL.createObjectURL(event.target.files[0])
}

function viewImage3(event) {
    document.getElementById('imgView3').src = URL.createObjectURL(event.target.files[0])
}

// function viewImage4(event) {
//     document.getElementById('imgView4').src = URL.createObjectURL(event.target.files[0])
// }


function viewImage(event, index) {
    let input = event.target;
    let reader = new FileReader();

    reader.onload = function () {
        let dataURL = reader.result;
        let image = document.getElementById('imgView' + index);
        image.src = dataURL;

        // Initialize Cropper.js on the image
        let cropper = new Cropper(image, {
            aspectRatio: NaN, // Square aspect ratio
            viewMode: 1,
            guides: true,
            background: true,
            autoCropArea: 1,
            zoomable: true,
        });

        // Show the image cropper container
        let cropperContainer = document.querySelector('#croppedImg' + index).parentNode;
        cropperContainer.style.display = 'block';

        // Update the cropped image when the "Save" button is clicked
        let saveButton = document.querySelector('#saveButton' + index);
        saveButton.addEventListener('click', async function () {
            let croppedCanvas = cropper.getCroppedCanvas();
            let croppedImage = document.getElementById("croppedImg" + index);
            croppedImage.src = croppedCanvas.toDataURL('image/jpeg', 1.0);

            // Destroy the cropper instance
            cropper.destroy();

            // Hide the cropper container
            cropperContainer.style.display = 'none';

            // Display the cropped image
            croppedImage.style.display = 'block';
        });
    };
    reader.readAsDataURL(input.files[0]);
}


$('document').ready(() => {
    const name = $('#name');
    const brand = $('#brand');
    const ram = $('#ram');
    const description = $('#description');
    const regularPrice = $('#regularPrice');
    const storage = $('#storage');
    const color = $('#color');
    const promotionalPrice = $('#promotionalPrice');
    const category = $('#category');
    const quantity = $('#quantity');


    $('form').submit(function (event) {
        event.preventDefault();
        console.log(category.val());
        if (isValidForm()) {
            this.submit();
        }
    });

    function isValidForm() {
        if (name.val().trim() === "") {
            displayMessage('name', 'Please enter a name');
            name.focus();
            return false;
        }
        if (brand.val().trim() === "") {
            displayMessage('brand', 'Please select a brand');
            name.focus();
            return false;
        }
        if (category.val().trim() === "") {
            console.log('cate', category.val());
            displayMessage('category', 'Please select a category');
            category.focus();
            return false;
        }
        if (brand.val().trim() !== "Apple" && ram.val().trim() === "") {
            console.log(brand.val().trim());
            displayMessage('ram', "Please select a valid ram size");
            ram.focus();
            return false;
        }
        if (storage.val().trim() === "") {
            displayMessage('storage', 'please select a valid storage size');
            storage.focus();
            return false;
        }
        if (color.val().trim() === "") {
            displayMessage('color', 'Please enter a valid color');
            color.focus();
            return false;
        }
        if (description.val().trim() === '') {
            displayMessage('description', 'Please enter a valid product description');
            description.focus();
            return false;
        }
        if (regularPrice.val().trim() === "" || isNaN(Number(regularPrice.val())) || Number(regularPrice.val()) < 1000) {
            displayMessage('regularPrice', 'Please enter a valid regular price greater than or equal to 1000');
            regularPrice.focus();
            return false;
        }
        if (promotionalPrice.val().trim() === "" || isNaN(Number(promotionalPrice.val().trim())) || Number(promotionalPrice.val()) > Number(regularPrice.val())) {
            displayMessage('promotionalPrice', `Please enter a valid promotional price less than or equal to ${regularPrice.val()}`);
            promotionalPrice.focus();
            return false;
        }
        // if (!$('input[name="categoryId"]:checked').val()) {
        //     displayMessage('category', `Please select a category`);
        //     category.focus();
        //     return false;
        // }
        if (quantity.val().trim() === "" || isNaN(Number(quantity.val().trim())) || Number(quantity.val().trim()) < 1) {
            displayMessage('qunatity', `Please enter a valid quantity greter than 0`);
            quantity.focus();
            return false;
        }
        const selectedImages = $('input[type="file"]').filter(function () {
            return this.files && this.files.length > 0;
        });
        if (selectedImages.length < 3) {
            $(`#image-error`).addClass('d-block').text('Please upload 4 images of the product');
            setTimeout(() => {
                $(`#image-error`).removeClass('d-block').text('');
            }, 3000);
            return false;
        }
        return true;
    }
    function displayMessage(input, message) {
        // Scroll the page to the input field
        $(`#${input}`).get(0).scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
        $(`#${input}-error`).addClass('d-block').text(message);
        setTimeout(() => {
            $(`#${input}-error`).removeClass('d-block').text('');
        }, 3000);
    }

})

document.getElementById('brand').addEventListener('change', function () {
    var brandSelect = document.getElementById('brand');
    var ramSelect = document.getElementById('ram');


    if (brandSelect.value === 'Apple') {
        ramSelect.disabled = true;
    } else {
        ramSelect.disabled = false;
    }
});