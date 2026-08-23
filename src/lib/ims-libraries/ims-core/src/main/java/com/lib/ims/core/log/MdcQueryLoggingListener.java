package com.lib.ims.core.log;

import java.util.List;
import net.ttddyy.dsproxy.ExecutionInfo;
import net.ttddyy.dsproxy.QueryInfo;
import net.ttddyy.dsproxy.listener.logging.SLF4JQueryLoggingListener;
import org.slf4j.MDC;

public class MdcQueryLoggingListener extends SLF4JQueryLoggingListener {
   public void afterQuery(ExecutionInfo execInfo, List<QueryInfo> queryInfoList) {
      MDC.put("duration", String.valueOf(execInfo.getElapsedTime()));
      MDC.put("logType", "DB_QUERY");

      try {
         super.afterQuery(execInfo, queryInfoList);
      } finally {
         MDC.remove("duration");
         MDC.remove("logType");
      }

   }
}
