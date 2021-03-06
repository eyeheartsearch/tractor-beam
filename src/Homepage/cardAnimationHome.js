export function cardAnimationHome() {

    let observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation) {
                setTimeout(animationOnCarousel, 1000)
            }
        });
    });

    const targetNode = document.querySelector('#stacked-carousels');
    observer.observe(targetNode, {
        // characterDataOldValue: true,
        // subtree: true,
        // characterData: true
        childList: true,
        // characterData: true
    });

    const animationOnCarousel = () => {



        let cardProduct = document.querySelectorAll('.carousel-list-container li')
        let cardProductSecondCarousel = document.querySelectorAll('.carousel-container li')

        // var checkExist = setInterval(function () {
        //     if (document.readyState === 'complete') {
        //         let imgs = document.querySelectorAll('.carousel-list-container li .image-wrapper img')
        //         imgs.forEach(i => {
        //             i.classList.add('revealCarousel')
        //         })
        //         clearInterval(checkExist);
        //     }
        // }, 500)

        cardProduct.forEach((product) => {
            animation(product)

        })
        cardProductSecondCarousel.forEach((product) => {
            animation(product)
        })

        function animation(product) {
            let addToCart = product.querySelector('.hit-addToCart')
            let imgOverlay = product.querySelector('.img-overlay')
            product.addEventListener('mouseenter', (e) => {
                if (addToCart) {
                    addToCart.classList.remove('fadeOutSize')
                    addToCart.classList.add('fadeInSize')
                    imgOverlay.style.opacity = 1

                }
            })
            product.addEventListener('mouseleave', (e) => {
                if (addToCart) {
                    addToCart.classList.add('fadeOutSize')
                    addToCart.classList.remove('fadeInSize')
                    imgOverlay.style.opacity = 0
                }
            })
        }
    }

    animationOnCarousel()

}


