/**
 * Created by inet2005 on 5/25/17.
 */
var hello = require("helloworld")
console.log(hello())
var $ = require("jquery")
window.onload = function() {
    document.getElementById("hello").innerText = hello()
    $("p").on('click', function(){
        alert("ooh that really hurt")
    });
}


