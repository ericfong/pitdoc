package com.eddyy.common;

import com.eddyy.common.HandlerAPI.Status;

public class HandleException extends Exception {
    private static final long serialVersionUID = 3739093852439394949L;

    private Status status;

    public HandleException(Status status, String message) {
        super(message);
        this.status = status;
    }

    public HandleException(Status status, String message, Exception e) {
        super(message, e);
        this.status = status;
    }

    public Status getStatus() {
        return status;
    }
}
