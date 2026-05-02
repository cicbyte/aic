package skills

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	model "github.com/cicbyte/aic/internal/model"
	"github.com/gogf/gf/v2/frame/g"
)

var gitAvailable *bool

func isGitAvailable() bool {
	if gitAvailable != nil {
		return *gitAvailable
	}
	cmd := exec.Command("git", "--version")
	err := cmd.Run()
	available := err == nil
	gitAvailable = &available
	if !available {
		g.Log().Warning(context.Background(), "Git not available, version control disabled")
	}
	return available
}

func gitInit(dirPath string) error {
	if !isGitAvailable() {
		return nil
	}

	cmd := exec.Command("git", "init")
	cmd.Dir = dirPath
	if output, err := cmd.CombinedOutput(); err != nil {
		g.Log().Warningf(context.Background(), "git init failed for %s: %s", dirPath, string(output))
		return nil
	}

	cmd = exec.Command("git", "config", "user.name", "aic")
	cmd.Dir = dirPath
	cmd.Run()

	cmd = exec.Command("git", "config", "user.email", "aic@local")
	cmd.Dir = dirPath
	cmd.Run()

	return nil
}

func gitCommitAll(dirPath string, message string) error {
	if !isGitAvailable() {
		return nil
	}

	cmd := exec.Command("git", "rev-parse", "--is-inside-work-tree")
	cmd.Dir = dirPath
	if err := cmd.Run(); err != nil {
		return nil
	}

	cmd = exec.Command("git", "add", "-A")
	cmd.Dir = dirPath
	if output, err := cmd.CombinedOutput(); err != nil {
		g.Log().Warningf(context.Background(), "git add failed: %s", string(output))
		return nil
	}

	cmd = exec.Command("git", "status", "--porcelain")
	cmd.Dir = dirPath
	output, err := cmd.Output()
	if err != nil || strings.TrimSpace(string(output)) == "" {
		return nil
	}

	commitMsg := fmt.Sprintf("%s [%s]", message, time.Now().Format("2006-01-02 15:04:05"))
	cmd = exec.Command("git", "commit", "-m", commitMsg)
	cmd.Dir = dirPath
	if output, err := cmd.CombinedOutput(); err != nil {
		g.Log().Warningf(context.Background(), "git commit failed: %s", string(output))
		return nil
	}

	return nil
}

func gitLog(dirPath string, maxCount int) ([]model.GitCommitInfo, error) {
	if !isGitAvailable() || maxCount <= 0 {
		return nil, nil
	}

	cmd := exec.Command("git", "rev-parse", "--is-inside-work-tree")
	cmd.Dir = dirPath
	if err := cmd.Run(); err != nil {
		return nil, nil
	}

	format := "%H|%an|%at|%s"
	cmd = exec.Command("git", "log", fmt.Sprintf("--max-count=%d", maxCount), fmt.Sprintf("--format=%s", format))
	cmd.Dir = dirPath
	output, err := cmd.Output()
	if err != nil {
		g.Log().Warningf(context.Background(), "git list tags failed for %s: %v", dirPath, err)
		return nil, err
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	commits := make([]model.GitCommitInfo, 0, len(lines))
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "|", 4)
		if len(parts) < 4 {
			continue
		}
		commits = append(commits, model.GitCommitInfo{
			Hash:      parts[0],
			Author:    parts[1],
			Timestamp: parts[2],
			Message:   parts[3],
		})
	}

	return commits, nil
}

func gitShowFile(dirPath string, commitHash string, relativeFilePath string) (string, error) {
	if !isGitAvailable() {
		return "", fmt.Errorf("git not available")
	}

	cmd := exec.Command("git", "show", commitHash+":"+relativeFilePath)
	cmd.Dir = dirPath
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

func gitDiff(dirPath string, fromHash string, toHash string) (string, error) {
	if !isGitAvailable() {
		return "", fmt.Errorf("git not available")
	}

	cmd := exec.Command("git", "diff", fromHash, toHash)
	cmd.Dir = dirPath
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

func clearSkillFiles(dirPath string) error {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.Name() == ".git" {
			continue
		}
		os.RemoveAll(filepath.Join(dirPath, entry.Name()))
	}
	return nil
}

func gitCreateTag(dirPath string, tag string, message string) error {
	if !isGitAvailable() {
		return fmt.Errorf("git 不可用")
	}
	// 检查是否有 commit
	cmd := exec.Command("git", "rev-parse", "HEAD")
	cmd.Dir = dirPath
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("没有提交记录，请先保存文件")
	}
	// 检查 tag 是否已存在
	cmd = exec.Command("git", "rev-parse", tag)
	cmd.Dir = dirPath
	if cmd.Run() == nil {
		return fmt.Errorf("标签 %s 已存在", tag)
	}
	cmd = exec.Command("git", "tag", "-a", tag, "-m", message)
	cmd.Dir = dirPath
	if output, err := cmd.CombinedOutput(); err != nil {
		g.Log().Warningf(context.Background(), "git tag failed: %s", string(output))
		return fmt.Errorf("%s", strings.TrimSpace(string(output)))
	}
	return nil
}

func gitListTags(dirPath string) ([]model.SkillTagInfo, error) {
	if !isGitAvailable() {
		return nil, nil
	}
	cmd := exec.Command("git", "for-each-ref", "--format=%(refname:short)|%(contents:subject)|%(creatordate:unix)", "--sort=-creatordate", "refs/tags/")
	cmd.Dir = dirPath
	output, err := cmd.Output()
	if err != nil {
		g.Log().Warningf(context.Background(), "git list tags failed for %s: %v", dirPath, err)
		return nil, err
	}
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	tags := make([]model.SkillTagInfo, 0, len(lines))
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "|", 3)
		if len(parts) < 2 {
			continue
		}
			note := parts[1]
		createdAt := ""
		if len(parts) >= 3 && parts[2] != "" {
			createdAt = parts[2]
		}
		tags = append(tags, model.SkillTagInfo{
			Tag:        parts[0],
			Note:       note,
			CreatedAt:  createdAt,
		})
	}
	return tags, nil
}

func gitCurrentTag(dirPath string) string {
	if !isGitAvailable() {
		return ""
	}
	cmd := exec.Command("git", "describe", "--tags", "--exact-match", "--abbrev=0")
	cmd.Dir = dirPath
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func gitDeleteTag(dirPath string, tag string) error {
	if !isGitAvailable() {
		return nil
	}
	cmd := exec.Command("git", "tag", "-d", tag)
	cmd.Dir = dirPath
	if output, err := cmd.CombinedOutput(); err != nil {
		g.Log().Warningf(context.Background(), "git tag -d failed: %s", string(output))
		return err
	}
	return nil
}

func gitCheckoutFiles(dirPath string, ref string) error {
	if !isGitAvailable() {
		return nil
	}
	cmd := exec.Command("git", "checkout", ref, "--", ".")
	cmd.Dir = dirPath
	if output, err := cmd.CombinedOutput(); err != nil {
		g.Log().Warningf(context.Background(), "git checkout failed: %s", string(output))
		return err
	}
	return nil
}
