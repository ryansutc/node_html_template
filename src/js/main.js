/**
 * Created by inet2005 on 5/25/17.
 */
var $ = require("jquery")
window.onload = function() {
    document.getElementById("hello").innerText = "hey you"
    $("button").on('click', function(){
        alert("You're all set with your js.")
    });
    
}


