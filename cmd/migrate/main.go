package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gfile"
)

func main() {
	ctx := context.Background()

	// 1. 查询所有技能
	result, err := g.DB().Model("skills").All(ctx)
	if err != nil {
		fmt.Println("Error querying skills:", err)
		return
	}

	fmt.Printf("Found %d skills to migrate\n\n", len(result))

	migrated := 0
	for _, row := range result {
		id := row["id"].Int()
		name := row["name"].String()
		oldPath := row["file_path"].String()

		if !isUUIDPath(oldPath) {
			fmt.Printf("  SKIP [%d] %s — already slug path: %s\n", id, name, oldPath)
			continue
		}

		newSlug := toSlug(name)
		candidate := newSlug
		oldDir := filepath.Join("data/skills", oldPath)

		// 检查冲突
		for i := 0; i < 10; i++ {
			newDir := filepath.Join("data/skills", candidate)
			if !gfile.Exists(newDir) || candidate == oldPath {
				break
			}
			suffix := fmt.Sprintf("%06x", id%0xFFFFFF)
			candidate = fmt.Sprintf("%s-%s", newSlug, suffix)
		}

		newDir := filepath.Join("data/skills", candidate)

		if !gfile.Exists(oldDir) {
			fmt.Printf("  WARN [%d] %s — directory not found: %s\n", id, name, oldDir)
			// 仅更新 DB
			g.DB().Model("skills").Where("id", id).Update(g.Map{"file_path": candidate})
			migrated++
			continue
		}

		// 重命名目录
		if err := os.Rename(oldDir, newDir); err != nil {
			fmt.Printf("  FAIL [%d] %s — rename error: %v\n", id, name, err)
			continue
		}

		// 更新 DB
		_, err = g.DB().Model("skills").Where("id", id).Update(g.Map{"file_path": candidate})
		if err != nil {
			fmt.Printf("  FAIL [%d] %s — db update error: %v\n", id, name, err)
			os.Rename(newDir, oldDir) // 回滚
			continue
		}

		// git init
		exec.Command("git", "init").Dir = newDir
		exec.Command("git", "config", "user.name", "aic").Dir = newDir
		exec.Command("git", "config", "user.email", "aic@local").Dir = newDir
		exec.Command("git", "add", "-A").Dir = newDir
		exec.Command("git", "commit", "-m", "Initial commit (migrated from UUID)").Dir = newDir

		fmt.Printf("  OK   [%d] %s — %s → %s\n", id, name, oldPath, candidate)
		migrated++
	}

	fmt.Printf("\nDone. Migrated %d skills.\n", migrated)
}

func isUUIDPath(s string) bool {
	return len(s) == 36 && strings.Count(s, "-") == 4
}

func toSlug(name string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(name) {
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' {
			b.WriteRune(r)
		} else if r == ' ' || r == '_' || r == '-' {
			b.WriteRune('-')
		}
	}
	s := strings.Trim(b.String(), "-")
	s = collapseDashes(s)
	if s == "" {
		return "skill"
	}
	return s
}

func collapseDashes(s string) string {
	var b strings.Builder
	prevDash := false
	for _, c := range s {
		if c == '-' {
			if !prevDash {
				b.WriteRune(c)
			}
			prevDash = true
		} else {
			b.WriteRune(c)
			prevDash = false
		}
	}
	return b.String()
}
