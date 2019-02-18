let initVerif = false;
let init = false; 
let selectedAddress = 0;
let listAddress = [];

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}


// Return address type xrb_ or nano_
function GetAddressType(description)
{
    if(description.includes("xrb_"))
    {
        return "xrb_";
    }
    else if(description.includes("nano_"))
    {
        return "nano_";
    }
}

// Return true or false if real address
function DescriptionHasNanoAddress(description)
{
    return description.includes("xrb_") || description.includes("nano_"); 
}


function IsFalseNanoAddress(address)
{
    var format = /[ !@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]/;
    return format.test(address);
}

// Return the actual nano wallet address 
function GetNanoAddress(description)
{
    let returnAddress = [];

    getIndicesOf("xrb_",description).forEach(function(indice)
    {

        let address =  description.substr(indice,64);
        if(!IsFalseNanoAddress(address))
        {
            returnAddress.push( address );
        }

    });

    getIndicesOf("nano_",description).forEach(function(indice)
    {

        let address =  description.substr(indice,65);
        if(!IsFalseNanoAddress(address))
        {
            returnAddress.push( address );
        }

    });
    

    console.log(returnAddress);
   // return returnAddress;
    return [... new Set(returnAddress)];
}


console.log("Document Verification");
chrome.runtime.onMessage.addListener(function(request, sender) {

    if(!initVerif){

        if (request.action == "getSource") {
           
    
            if(DescriptionHasNanoAddress(request.source))
            {
                let nanoAddress = GetNanoAddress(request.source);
                console.log(nanoAddress);

                if(typeof nanoAddress !== 'undefined' && nanoAddress.length > 0 )
                {
                    listAddress = nanoAddress;
                    UpdateMessage();
                }
                else
                {
                    message.innerText = "No nano address found";
                }
               
            }
            else
            {
                message.innerText = "No nano address found";
            }

            initVerif = true;
        }
    }

});

document.addEventListener('copy', function(e) {
    e.clipboardData.setData('text/plain', listAddress[selectedAddress]);
    e.preventDefault();
  });

function UpdateMessage()
{
    let nanodeAddress = "https://www.nanode.co/account/" + listAddress[selectedAddress]
    message.innerHTML = "<a id='messageLink'  href='" + nanodeAddress +  "'>" + listAddress[selectedAddress]  + "</a>" ;
    message.innerHTML += "<br>" + (selectedAddress + 1 ) + "/" + listAddress.length;
    document.getElementById("messageLink").addEventListener("click", CopyToClipboard);

   
}

function UpdatePrice()
{
    // 
    console.log("Update price");
    let element = document.getElementById("nano_amount");
    if(element && element.value && element.value > 0)
    {
        let elemPrice = document.getElementById("price_tag");
        let resp = JSON.parse(httpGet("https://min-api.cryptocompare.com/data/pricemulti?fsyms=NANO&tsyms=BTC,USD,EUR&api_key=6adba1b1c5bfc11a8b427216403e62d9908b0936bff3189fccdb91218f89506b"));

        console.log(resp);
        let amount = element.value;
        let finalString = (amount * resp.NANO.BTC).toFixed(7) + " BTC"+ "<br/>" + (amount * resp.NANO.EUR).toFixed(2) + " EUR"+ "<br/>" + (amount * resp.NANO.USD).toFixed(2) + " USD";

        elemPrice.innerHTML = finalString;
    }
}

function CopyToClipboard()
{
    document.execCommand('copy');
}

function DecrementSelectedAddress()
{
    console.log("Decrement");
    if(listAddress[selectedAddress -1] != undefined)
    {
        selectedAddress--;
        UpdateMessage();
    }
}

function IncrementSelectedAddress()
{
    console.log("Increment");
    if(listAddress[selectedAddress+1] != undefined)
    {
        selectedAddress++;
        UpdateMessage();
    }
}

function MouseOver()
{
    document.getElementById("rightArrow").style.color = "#3789da";
    document.getElementById("leftArrow").style.color = "#3789da";
}

function MouseOut()
{
    document.getElementById("rightArrow").style.color = "#EC6022";
    document.getElementById("leftArrow").style.color = "#EC6022";
}

function CreateNewTab()
{
    chrome.tabs.create({url: "https://nano.org/en"});
}

function onWindowLoad() {

    var message = document.querySelector('#message');

    document.getElementById("tip_button").addEventListener("click", TipButtonPressed);

    document.getElementById("image_logo").addEventListener("click", CreateNewTab);

    document.getElementById("nano_amount").addEventListener("keyup", UpdatePrice);
    document.getElementById("nano_amount").addEventListener("mouseup", UpdatePrice);

    document.getElementById("rightArrow").addEventListener("click", IncrementSelectedAddress);
    document.getElementById("leftArrow").addEventListener("click", DecrementSelectedAddress);

    document.getElementById("rightArrow").addEventListener("mouseover", MouseOver);
    document.getElementById("rightArrow").addEventListener("mouseout", MouseOut);

    document.getElementById("leftArrow").addEventListener("mouseover", MouseOver);
    document.getElementById("leftArrow").addEventListener("mouseout", MouseOut);
  
    if(!init)
    {
        chrome.tabs.executeScript(null, {
            file: "getPageSources.js"
          }, function() {
            // If you try and inject into an extensions page or the webstore/NTP you'll get an error
            if (chrome.runtime.lastError) {
              message.innerText = "You can't use the extension here !";
            }
          });

        init = true;
    }

}
window.onload = onWindowLoad;

function hideStuff(){
    var el = document.querySelector('#content_container');
    var node, nodes = [];
    
    do {
      var parent = el.parentNode;
      
      // Collect element children
      for (var i=0, iLen=parent.childNodes.length; i<iLen; i++) {
        node = parent.childNodes[i];
  
        // Collect only sibling nodes that are elements and not the current element
        if (node.nodeType == 1 && node != el) {
          nodes.push(node);
        }
      }
  
      // Go up to parent
      el = parent;
  
    // Stop when processed the body's child nodes
    } while (el.tagName.toLowerCase() != 'body');
  
    // Hide the collected nodes
    nodes.forEach(function(node){
      node.style.display = 'none';
    });
}

function TipButtonPressed()
{
    if(listAddress.length > 0 && listAddress[selectedAddress] && !IsFalseNanoAddress(listAddress[selectedAddress]) )
    {

        let nbreNano = document.getElementById("nano_amount").value;
        if(nbreNano >= 0.000001)
        {
            console.log("Nobre nano : ", nbreNano);
            console.log("Address : ", listAddress[selectedAddress]);

            let nanoToRai = nbreNano * 1000000;

            // Render the Nano button
            brainblocks.Button.render({
                    
                // Pass in payment options
                payment: {
                    currency: 'rai',
                    amount: nanoToRai,
                    destination: listAddress[selectedAddress]
                },

                // Handle successful payments
                onPayment: function(data) {
                    // 4. Call BrainBlocks API to verify data.token
                    // See tab #2
                }
                }, '#nano-button');

            // Make sure brainblocks button is visible
            let brainblocksButton = document.getElementById("nano-button");
            brainblocksButton.style.display = 'block';
            hideStuff();
        }
    }
}

