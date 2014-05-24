package com.eddyy.android;

import java.lang.reflect.Method;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.regex.Pattern;

import com.eddyy.android_httpd.Httpd;
import com.eddyy.android_httpd.Sessions;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pithway.doc.PithwayAppActivity;

import android.content.Context;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.util.Log;

public final class NetworkHelper {
    private final String TAG = NetworkHelper.class.getName();
    
    private WifiManager mWifiManager = null;
    private Method setWifiApEnabledMethod;
    private Method getWifiApConfigurationMethod;
    private Method getWifiApStateMethod;
    
    private boolean originalWifiEnabled = false;
    private boolean originalSetted = false;
    private long setStationEnabledMsec = 0;
    
    private ObjectMapper JSON = new ObjectMapper();

    public NetworkHelper(PithwayAppActivity activity) {
        try {
            mWifiManager = (WifiManager) activity.getSystemService(Context.WIFI_SERVICE);
            setWifiApEnabledMethod = mWifiManager.getClass().getMethod("setWifiApEnabled", WifiConfiguration.class, boolean.class);
            getWifiApConfigurationMethod = mWifiManager.getClass().getMethod("getWifiApConfiguration");
            getWifiApStateMethod = mWifiManager.getClass().getMethod("getWifiApState");
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e2) {
            e2.printStackTrace();
        }
    }

    public boolean setStationEnabled(boolean enabled) {
        setStationEnabledMsec = System.currentTimeMillis();
        
        try {
            if (enabled) {
                if (!this.originalSetted) {
                    this.originalWifiEnabled = this.getWifiEnabled();
                    this.originalSetted = true;
                }
                // disable the normal wifi
                mWifiManager.setWifiEnabled(false);
            } else {
                Log.d(TAG, "NetWifi Original Wifi Enabled: "+this.originalWifiEnabled);
                if (this.originalWifiEnabled) {
                    // enable the normal wifi back
                    mWifiManager.setWifiEnabled(true);
                }
            }
            
            // actually turn the Station mode on/off 
            WifiConfiguration config = this.getStationConfiguration();
            boolean ret = (Boolean) setWifiApEnabledMethod.invoke(mWifiManager, config, enabled);
            
            Sessions.INSTANCE.appNotify("wifiStation", enabled+"");
            
            return ret;
        } catch (Exception e) {
            Log.e(TAG, "", e);
            return false;
        }
    }
    
    public void ensureWifiOrStation() {
        if (getWifiEnabled())
            return;
        if (getStationEnabled())
            return;
        setStationEnabled(true);
    }
    
    private boolean getStationEnabled() {
        try {
            if (getWifiApStateMethod == null)
                return false;
            int state = (Integer) getWifiApStateMethod.invoke(mWifiManager);
            Log.d(TAG, "NetWifi Station: "+Integer.toBinaryString(state)+" "+state+" "+(state == 13));
            return state == 13;
        } catch (Exception e) {
            Log.e(TAG, "", e);
            return false;
        }
    }

    private WifiConfiguration getStationConfiguration() {
        try {
            return (WifiConfiguration) getWifiApConfigurationMethod.invoke(mWifiManager, (Class<?>) null);
        } catch (Exception e) {
            return null;
        }
    }
    
    private boolean getWifiEnabled() {
        try {
            int state = this.mWifiManager.getWifiState();
            return state == WifiManager.WIFI_STATE_ENABLED || state == WifiManager.WIFI_STATE_ENABLING;
        } catch (Exception e) {
            Log.e(TAG, "", e);
            return false;
        }
    }
    
    public void checkNotify() {
        long setTimeDiff = System.currentTimeMillis() - setStationEnabledMsec;
        //Log.d(TAG, "NetWifi Diff: "+setTimeDiff);
        if (setTimeDiff < 2000) {
            return;
        }

        Sessions.INSTANCE.appNotify("wifiStation", "check");
    }
    
    public String getServer() {
        String ipAddress = null;
        boolean stationEnabled = this.getStationEnabled();
        
        // ipAddress
        if (stationEnabled) {
            // station
            System.setProperty("java.net.preferIPv4Stack" , "true");
            Pattern ipPattern = Pattern.compile("\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}");
            try {
                for (Enumeration<?> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements() && ipAddress == null;) {
                    NetworkInterface intf = (NetworkInterface) en.nextElement();
                    if (intf.getName().contains("wlan")) {
                        for (Enumeration<?> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements() && ipAddress == null;) {
                            InetAddress inetAddress = (InetAddress) enumIpAddr.nextElement();
                            if (!inetAddress.isLoopbackAddress()) {
                                String ipStr = inetAddress.getHostAddress().toString();
                                if (ipPattern.matcher(ipStr).matches()) {
                                    ipAddress = ipStr;
                                }
                            }
                        }
                    }
                }
            } catch (SocketException ex) {
                ex.printStackTrace();
            }
        } else {
            WifiInfo wifiInfo = this.mWifiManager.getConnectionInfo();
            // normal wifi
            int ip = wifiInfo.getIpAddress();
            if (ip > 0) {
                ipAddress = (ip&0xFF)+"."+((ip=ip>>8)&0xFF)+"."+((ip=ip>>8)&0xFF)+"."+((ip=ip>>8)&0xFF);
            }
        }
        
        // httpdPort
        return ipAddress+":"+Httpd.getPort();
    }
    
    public ObjectNode getJsonObject() {
        ObjectNode output = JSON.createObjectNode();
        try {
            
            // isWifiStation
            boolean isWifiStation = this.getStationEnabled();
            output.put("isWifiStation", isWifiStation);
            
            // wifiName
            if (isWifiStation) {
                // station enabled 
                WifiConfiguration config = this.getStationConfiguration();
                output.put("wifiName", config.SSID);
            } else {
                if (getWifiEnabled()) {
                    // normal wifi enabled
                    WifiInfo wifiInfo = this.mWifiManager.getConnectionInfo();
                    //wifiInfo.getSupplicantState() == SupplicantState.COMPLETED
                    String wifiName = wifiInfo.getSSID().replaceFirst("^\"", "").replaceFirst("\"$", "");
                    output.put("wifiName", wifiName);
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "", e);
        }
        return output;
    }
}