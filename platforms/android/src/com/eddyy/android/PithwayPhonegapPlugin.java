package com.eddyy.android;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import com.eddyy.android_httpd.CordovaHandler;
import com.pithway.doc.PithwayAppActivity;

public class PithwayPhonegapPlugin extends CordovaPlugin {
    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        final PithwayAppActivity activity = (PithwayAppActivity) cordova.getActivity();
        if ("GET".equals(action) || "PUT".equals(action)) {
            final String url = args.getString(0);
            final String body = args.getString(1);
            final JSONObject jsonHeaders = args.getJSONObject(2);
//            cordova.getThreadPool().execute(new Runnable() {
//                public void run() {
                    try {
                        CordovaHandler handler = new CordovaHandler();
                        handler.init(activity);
                        
                        Map<String, String> reqParams = new HashMap<String, String>();
                        reqParams.put("content", body);
                        
                        Map<String, String> reqHeaders = new HashMap<String, String>();
                        Iterator<?> itr = jsonHeaders.keys();
                        while (itr.hasNext()) {
                            String key = (String) itr.next();
                            reqHeaders.put(key, jsonHeaders.getString(key));
                        }
    
                        // handle
                        String reqUrl = url;
                        if (url.charAt(0) != '/')
                            reqUrl = "/"+url;
                        handler.handle(action, reqUrl, reqParams, reqHeaders, null);
                        
                        // response
                        JSONObject response = new JSONObject();
                        response.put("status", handler.getResStatus());
                        response.put("body", handler.getResBody());
                        JSONObject resHeaders = new JSONObject();
                        for (Entry<String, String> entry : handler.getResHeaders().entrySet()) {
                            resHeaders.put(entry.getKey(), entry.getValue());
                        }
                        response.put("headers", resHeaders);
                        
                        callbackContext.success(response);
                        System.out.println("res: "+reqUrl);
                    } catch (JSONException e) {
                        e.printStackTrace();
                        callbackContext.error(e.getMessage());
                    }
//                }
//            });
            return true;
        }
        return false;
    }
}

