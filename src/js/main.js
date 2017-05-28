/**
 * Created by inet2005 on 5/25/17.
 */
var hello = require("helloworld")
console.log(hello())
var $ = require("jquery")

$("p").onclick(function(){
    alert("ooh that tickled")
})

