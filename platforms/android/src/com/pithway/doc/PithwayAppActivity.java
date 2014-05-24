package com.pithway.doc;

import java.io.File;
import java.util.Locale;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.View;

import org.apache.cordova.*;

import com.eddyy.android.NetworkHelper;
import com.eddyy.android_httpd.*;

public class PithwayAppActivity extends CordovaActivity {
    public static final String TAG = PithwayAppActivity.class.getName();
	public File packageFile;

    //private NsdHelper nsdHelper;
    private NetworkHelper networkHelper;
	private BroadcastReceiver receiver;
	
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

        // variables for both Web and Cordova Handlers
        String packageName = this.getClass().getPackage().getName();
        
        try {
            ApplicationInfo appInfo = this.getContext().getPackageManager().getApplicationInfo(packageName, 0);
            String packageFileStr = appInfo.sourceDir;
            this.packageFile = new File(packageFileStr);
        } catch (NameNotFoundException e) {
        }
        
        String dbDirName = packageName.replaceFirst("com\\.([^.]+).*", "$1");
        dbDirName = dbDirName.substring(0, 1).toUpperCase(Locale.US) + dbDirName.substring(1);
        File dbDirFile = null;
        if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
            dbDirFile = new File(Environment.getExternalStorageDirectory(), dbDirName);
        } else {
        	dbDirFile = new File(this.getFilesDir(), dbDirName);
        }
        Log.d(TAG, "FileDB.setup: " + dbDirFile.getAbsolutePath());
        FileDB.setup(dbDirFile);

        // set properties
        //super.setIntegerProperty("backgroundColor", Color.TRANSPARENT);     
        
		this.afterCreate();

        // Display vertical scrollbar and hide horizontal scrollBar
        appView.setVerticalScrollBarEnabled(true);
        appView.setHorizontalScrollBarEnabled(false);
        appView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        
        // BroadcastReceiver
        final PithwayAppActivity activity = this;
        this.receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                activity.getNetworkHelper().checkNotify();
            }
        };
        
        // Network Service Discovery Manager Helper
        //nsdHelper = new NsdHelper(this);
        networkHelper = new NetworkHelper(this);

        Httpd.startup();
        Httpd.getHttpd().setActivity(this);
        int httpdPort = Httpd.getPort();
        if (httpdPort >= 0) {
            // Register httpd to the NSD
            //nsdHelper.registerService(httpdPort);
        }
        
        // Session is depend on Httpd
        Sessions.INSTANCE.addAppClient(appView);
	}
	public void afterCreate() {
		// Set by <content src="index.html" /> in config.xml
        //super.loadUrl(Config.getStartUrl());
        super.loadUrl("file:///android_asset/www/gen.cordova.html");
	}
	
//    public void appClientFireEvent(ObjectNode event) {
//        Sessions.INSTANCE.sessionFireEvent(Sessions.INSTANCE.APP_SESSION_ID, event);
//        // inside SessionManager control fireEvent to activity or not
//        //this.appClientNotify();
//    }
    
    @Override
    protected void onPause() {
        unregisterReceiver(receiver);
//            nsdHelper.stopDiscovery();
        super.onPause();
    }
    
    @Override
    protected void onResume() {
        IntentFilter filter = new IntentFilter();
        //filter.addAction("android.net.conn.CONNECTIVITY_CHANGE");
        filter.addAction("android.net.wifi.WIFI_STATE_CHANGED");
        registerReceiver(receiver, filter);
        
        super.onResume();
//            nsdHelper.discoverServices();
    }
    
    @Override
    public void onDestroy() {
        Sync.INSTANCE.shutdown();
        //nsdHelper.tearDown();
        Httpd.shutdown();
        super.onDestroy();
    }
    
    public NetworkHelper getNetworkHelper(){
        return this.networkHelper;
    }
}
