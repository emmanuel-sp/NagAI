/** DeploymentPanel Component - Deploy/Redeploy/Stop agent button and status. Parent: AgentBuilderContainer */
"use client";
import { IoRocket, IoRefresh, IoStop } from "@/components/icons";
import styles from "./agent-builder.module.css";

interface DeploymentPanelProps {
  isDeployed: boolean;
  canDeploy: boolean;
  isDeploying: boolean;
  onDeploy: () => void;
  onStop: () => void;
}

export default function DeploymentPanel({
  isDeployed,
  canDeploy,
  isDeploying,
  onDeploy,
  onStop,
}: DeploymentPanelProps) {
  return (
    <div className={styles.deploymentPanel}>
      <div className={styles.deploymentInfo}>
        <h2 className={styles.cardTitle}>
          {isDeployed ? "Agent Deployed" : "Ready to Deploy?"}
        </h2>
        <p className={styles.cardSubtitle}>
          {isDeployed
            ? "Your agent is live and will start communicating based on your contexts."
            : "Deploy your agent to activate communication. You must have at least one context."}
        </p>
      </div>

      <div className={styles.deploymentActions}>
        <div className={styles.deploymentButtons}>
          {isDeployed ? (
            <>
              <button
                onClick={onDeploy}
                disabled={isDeploying}
                className={`${styles.deployButton} ${styles.redeployButton}`}
              >
                {isDeploying ? (
                  <>
                    <div className={styles.deploySpinner} />
                    Deploying...
                  </>
                ) : (
                  <>
                    <IoRefresh size={20} />
                    Redeploy Agent
                  </>
                )}
              </button>
              <button
                onClick={onStop}
                disabled={isDeploying}
                className={`${styles.deployButton} ${styles.stopButton}`}
              >
                <IoStop size={20} />
                Stop Agent
              </button>
            </>
          ) : (
            <button
              onClick={onDeploy}
              disabled={!canDeploy || isDeploying}
              className={styles.deployButton}
            >
              {isDeploying ? (
                <>
                  <div className={styles.deploySpinner} />
                  Deploying...
                </>
              ) : (
                <>
                  <IoRocket size={20} />
                  Deploy Agent
                </>
              )}
            </button>
          )}
        </div>

        {!isDeployed && !canDeploy && (
          <p className={styles.warningText}>
            Create at least one context before deploying
          </p>
        )}
      </div>
    </div>
  );
}
