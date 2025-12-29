/** DeploymentPanel Component - Deploy/Redeploy/Stop agent button and status. Parent: AgentBuilderContainer */
"use client";
import { IoRocket, IoRefresh, IoStop } from "react-icons/io5";
import styles from "@/styles/agent/agent-builder.module.css";

interface DeploymentPanelProps {
  isDeployed: boolean;
  canDeploy: boolean;
  isDeploying: boolean;
  deployedAt?: Date;
  onDeploy: () => void;
  onStop: () => void;
}

export default function DeploymentPanel({
  isDeployed,
  canDeploy,
  isDeploying,
  deployedAt,
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
        {deployedAt && (
          <p className={styles.deploymentDate}>
            Deployed on {deployedAt.toLocaleDateString()} at{" "}
            {deployedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className={styles.deploymentActions}>
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

        {!isDeployed && !canDeploy && (
          <p className={styles.warningText}>
            Create at least one context before deploying
          </p>
        )}
      </div>
    </div>
  );
}
