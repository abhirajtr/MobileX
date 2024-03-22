function outer () {
    let x = 1;
    function inner() {
        console.log(x);
    }
    return inner;
}

let a = outer();

a();