/**
 * Created by inet2005 on 5/25/17.
 */
var hello = require("helloworld")
console.log(hello())
var $ = require("jquery")
window.onload = function() {
    document.getElementById("hello").innerText = hello()
    $("button").on('click', function(){
        alert("You're all set with your js. give'r")
    });
    
}


