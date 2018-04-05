
var OAuth = require('./OAuth');

var client_id = null;
var client_secret = null;
var redirect_url = null;
var user_identifier = null;
var mysql_module = "./mysql/mysql_util" ; // false value for working without DB
var access_token = null;
var iamurl = "accounts.zoho.com";
var baseURL = "www.zohoapis.com";
var version = "v2";


 var ZCRMRestClient = function(){};

 ZCRMRestClient.initialize = function(configJSON){

    
 return new Promise(function(resolve,reject){

    if(configJSON){

        ZCRMRestClient.initializeWithValues(configJSON);
        resolve();

    }

    var PropertiesReader = require('properties-reader');
    var properties = PropertiesReader('resources/oauth_configuration.properties');
    var client_id  = properties.get('zoho.crm.clientid');
    var client_secret = properties.get('zoho.crm.clientsecret');
    var redirect_url = properties.get('zoho.crm.redirecturl');
    var iam_url =properties.get('zoho.crm.iamurl')?properties.get('zoho.crm.iamurl'):iamurl;
    mysql_module = properties.get('zoho.crm.mysqlmodule')?properties.get('zoho.crm.mysqlmodule'):mysql_module;

    var config_properties = PropertiesReader('resources/configuration.properties');
    
    baseURL = config_properties.get('crm.api.url')?config_properties.get('crm.api.url'):baseURL;
    
    if(config_properties.get('crm.api.user_identifier')){

        ZCRMRestClient.setUserIdentifier(config_properties.get('crm.api.user_identifier'));
    }

    if(!client_id || !client_secret || !redirect_url){

        throw new Error("Populate the oauth_configuration.properties file");

    }

    ZCRMRestClient.setClientId(client_id);
    ZCRMRestClient.setClientSecret(client_secret);
    ZCRMRestClient.setRedirectURL(redirect_url);
    ZCRMRestClient.setIAMUrl(iam_url);

    resolve();

    })
 }

 ZCRMRestClient.initializeWithValues = function(configJSON){


    var client_id  = configJSON.client_id;
    var client_secret = configJSON.client_secret;
    var redirect_url = configJSON.redirect_url;
    var iam_url = configJSON.iamurl?configJSON.iamurl:iamurl;
    mysql_module = configJSON.mysql_module?configJSON.mysql_module:mysql_module;
   
    baseURL = configJSON.baseurl?configJSON.baseurl:baseURL;
    version = configJSON.version?configJSON.version:version;

    ZCRMRestClient.setClientId(client_id);
    ZCRMRestClient.setClientSecret(client_secret);
    ZCRMRestClient.setRedirectURL(redirect_url); 
    

 }

 ZCRMRestClient.generateAuthTokens = function(user_identifier,grant_token){

    return new Promise(function(resolve,reject){

        if(!user_identifier){

            user_identifier = ZCRMRestClient.getUserIdentifier();
        }

    var config = ZCRMRestClient.getConfig(grant_token);
    new OAuth(config,"generate_token");
    var api_url = OAuth.constructurl("generate_token");

    OAuth.generateTokens(api_url).then(function(response){

        if(response.statusCode!=200){

            throw new Error("Problem occured while generating access token from grant token");

        }
        
        var mysql_util = mysql_module?require(mysql_module):mysql_module;
        var resultObj = ZCRMRestClient.parseAndConstructObject(response);
        resultObj.user_identifier = user_identifier;
       
        if(resultObj.access_token){
            if(mysql_util){
                mysql_util.saveOAuthData(resultObj);
            }
            
            ZCRMRestClient.setUserIdentifier(user_identifier);
            resolve(resultObj);
             
        } else {
        
            throw new Error("Problem occured while generating access token and refresh token from grant token");
            
        }

    })
})
}


ZCRMRestClient.generateAuthTokenfromRefreshToken = function(user_identifier,refresh_token){

    return new Promise(function(resolve,reject){

        if(!user_identifier){

            user_identifier = ZCRMRestClient.getUserIdentifier();
        }

        var config = ZCRMRestClient.getConfig_refresh(refresh_token);
        new OAuth(config,"refresh_access_token");
        var api_url = OAuth.constructurl("generate_token");

        OAuth.generateTokens(api_url).then(function(response){
        
            if(response.statusCode!=200){

                throw new Error("Problem occured while generating access token from refresh token");

            }
            var mysql_util = mysql_module ? require(mysql_module) : mysql_module;
            var resultObj = ZCRMRestClient.parseAndConstructObject(response);
            resultObj.user_identifier = user_identifier;
       
            if(resultObj.access_token){
            
                if(mysql_util){
                    mysql_util.saveOAuthData(resultObj);
                }
            
                ZCRMRestClient.setUserIdentifier(user_identifier);
                //resolveObj.success = true,
                //resolveObj.response = resultObj,
                resolve(resultObj);
         
            } else {
            
                throw new Error("Problem occured while generating access token from refresh token");
            
            }
        
    })
})
};


ZCRMRestClient.getConfig = function(grant_token){

    var config = {};

    config.client_id = ZCRMRestClient.getClientId();
    config.client_secret = ZCRMRestClient.getClientSecret();
    config.code = grant_token;
    config.redirect_uri = ZCRMRestClient.getRedirectURL();
    config.grant_type = "authorization_code";

    return config;

};

ZCRMRestClient.getConfig_refresh = function(refresh_token){

        var config = {};

        config.client_id = ZCRMRestClient.getClientId();
        config.client_secret = ZCRMRestClient.getClientSecret(); 
        config.refresh_token = refresh_token;
        config.grant_type = "refresh_token";

        return config;

}

ZCRMRestClient.setClientId = function(clientid){

    client_id = clientid;
}

ZCRMRestClient.setClientSecret = function(clientsecret){

    client_secret = clientsecret;

}

ZCRMRestClient.setRedirectURL = function(redirecturl){

    redirect_url = redirecturl;
}

ZCRMRestClient.setUserIdentifier = function(useridentifier){

    user_identifier = useridentifier;

}

ZCRMRestClient.setIAMUrl = function(iam_url){

    iamurl = iam_url;
}

ZCRMRestClient.setBaseURL = function(baseurl){

    baseURL = baseurl;
}

ZCRMRestClient.setSqlModule = function(module) {
    
    mysql_module = module;
}

ZCRMRestClient.setAccessToken = function(token) {
    
    access_token = token;
} 

ZCRMRestClient.getClientId = function(){

    return client_id;

}

ZCRMRestClient.getClientSecret = function(){

    return client_secret;

}

ZCRMRestClient.getRedirectURL = function(){

    return redirect_url;
}

ZCRMRestClient.getUserIdentifier = function(){

    return user_identifier;
}

ZCRMRestClient.getMySQLModule = function(){

    return mysql_module;
}

ZCRMRestClient.getAPIURL = function(){

    return baseURL;
}

ZCRMRestClient.getVersion = function(){

    return version;
}

ZCRMRestClient.getIAMUrl = function(){

    return iamurl;
}

ZCRMRestClient.getAccessToken = function(){
    
    return access_token;
}

ZCRMRestClient.getMySQLModule = function(){

    return mysql_module;
}

ZCRMRestClient.parseAndConstructObject = function(response){

    var body = response["body"];
    body = JSON.parse(body);

    var date = new Date();
    var current_time = date.getTime();

    var resultObj = {};
    
    if(body.access_token){

        resultObj.access_token = body.access_token;
        resultObj.refresh_token = body.refresh_token;
        resultObj.expires_in = body.expires_in+current_time;
    }
    return resultObj;

}

 ZCRMRestClient.API = require('./crmapi');

 module.exports = ZCRMRestClient;