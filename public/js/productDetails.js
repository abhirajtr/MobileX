$(document).ready(() => {
    console.log('Document is ready');

    $('#addToCart').click(() => {
        const productId = $('#addToCart').data('productid');
        console.log(productId);
        $.ajax({
            url: '/addTocart',
            type: 'POST',
            data: { productId },
            success: handleSuccess 
        })
    });

    function handleSuccess(response) {
        if(response.status === "success") {
            $('#addToCart').text('Go to Cart').css('background-color', 'green');
        }
    }
});
